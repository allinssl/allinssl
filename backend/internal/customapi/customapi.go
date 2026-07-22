// Package customapi 提供「自定义API」通用执行引擎：
// 多步 HTTP 请求、{{变量}} 替换、公式计算、响应提取。
// 供通知渠道、证书申请等多个场景复用。
package customapi

import (
	"ALLinSSL/backend/public"
	"crypto/hmac"
	"crypto/md5"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"crypto/tls"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/google/uuid"
)

// ============= 配置结构 =============

type KeyValue struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type ResponseExtract struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Process bool   `json:"process,omitempty"` // true=过程变量：仅公式计算可见，不进入请求可用变量
}

// SuccessCondition 按响应内容判断成功：解析字段值与期望值比较
type SuccessCondition struct {
	Field    string `json:"field"`    // 解析字段（jsonpath 或正则，随 Format）
	Operator string `json:"operator"` // eq|ne|contains|not_contains|gt|lt（默认 eq）
	Value    string `json:"value"`
}

type ResponseConfig struct {
	Format      string            `json:"format"` // json | xml（默认 json）
	Variables   []Variable        `json:"variables,omitempty"` // 预处理变量：用 {{__raw__}} 计算，链式可见，结果供后续使用
	SuccessCode int               `json:"success_code"`
	Condition   *SuccessCondition `json:"condition,omitempty"`
	Extracts    []ResponseExtract `json:"extracts"`
}

type Variable struct {
	Name    string `json:"name"`
	Formula string `json:"formula"`
	Process bool   `json:"process,omitempty"` // true=过程变量：仅公式计算可见，不进入请求可用变量
}

type Step struct {
	Name      string         `json:"name"`
	Method    string         `json:"method"`
	Url       string         `json:"url"`
	Timeout   int            `json:"timeout"`
	Insecure  bool           `json:"insecure,omitempty"` // 忽略 SSL 证书校验
	When      string         `json:"when,omitempty"`     // 执行条件（公式，结果为 true/1 才执行，留空总是执行）
	Headers   []KeyValue     `json:"headers"`
	Params    []KeyValue     `json:"params"`
	Cookies   []KeyValue     `json:"cookies"`
	Body      string         `json:"body"`
	Variables []Variable     `json:"variables,omitempty"` // 步骤级变量：在该步骤请求前求值
	Response  ResponseConfig `json:"response"`
}

type Config struct {
	Name      string     `json:"name"`
	Enabled   string     `json:"enabled"`
	Usage     string     `json:"usage,omitempty"` // cert | host | notify（授权API场景）
	Variables []Variable `json:"variables"`
	Steps     []Step     `json:"steps"`
}

// ============= 变量替换 =============

var variableRegex = regexp.MustCompile(`\{\{\s*([a-zA-Z0-9_.\-\[\]]+)\s*\}\}`)

func replaceVariables(input string, ctx map[string]string) string {
	if input == "" {
		return input
	}
	return variableRegex.ReplaceAllStringFunc(input, func(match string) string {
		key := variableRegex.FindStringSubmatch(match)[1]
		if v, ok := ctx[key]; ok {
			return v
		}
		return match
	})
}

// ============= 公式引擎 =============

type tokenType int

const (
	tokEOF tokenType = iota
	tokString
	tokIdent
	tokNumber
	tokComma
	tokLParen
	tokRParen
)

type token struct {
	typ tokenType
	val string
}

type lexer struct {
	input  string
	pos    int
	values []string // 变量占位符值表（\x01<idx>\x02 引用）
}

func newLexer(input string, values []string) *lexer {
	return &lexer{input: input, values: values}
}

func (l *lexer) peek() byte {
	if l.pos >= len(l.input) {
		return 0
	}
	return l.input[l.pos]
}

func (l *lexer) next() byte {
	if l.pos >= len(l.input) {
		return 0
	}
	ch := l.input[l.pos]
	l.pos++
	return ch
}

func (l *lexer) skipWhitespace() {
	for l.pos < len(l.input) {
		c := l.peek()
		if c == ' ' || c == '\t' || c == '\n' || c == '\r' {
			l.next()
		} else {
			break
		}
	}
}

func (l *lexer) readString() (string, error) {
	var sb strings.Builder
	for {
		c := l.next()
		if c == 0 {
			return "", fmt.Errorf("字符串未闭合")
		}
		if c == 0x01 {
			// 字符串内的变量占位符：原样写入值，无需转义
			idx, err := l.readPlaceholder()
			if err != nil {
				return "", err
			}
			sb.WriteString(l.values[idx])
			continue
		}
		if c == '"' {
			break
		}
		if c == '\\' {
			next := l.next()
			switch next {
			case 'n':
				sb.WriteByte('\n')
			case 't':
				sb.WriteByte('\t')
			case 'r':
				sb.WriteByte('\r')
			case '\\':
				sb.WriteByte('\\')
			case '"':
				sb.WriteByte('"')
			default:
				sb.WriteByte(next)
			}
		} else {
			sb.WriteByte(c)
		}
	}
	return sb.String(), nil
}

// readPlaceholder 读取 \x01<idx>\x02 占位符并返回下标（调用时 pos 位于 <idx> 起始处）
func (l *lexer) readPlaceholder() (int, error) {
	start := l.pos
	for l.pos < len(l.input) && l.input[l.pos] != 0x02 {
		l.pos++
	}
	if l.pos >= len(l.input) {
		return 0, fmt.Errorf("变量占位符未闭合")
	}
	idx, err := strconv.Atoi(l.input[start:l.pos])
	l.pos++ // 跳过 \x02
	if err != nil || idx < 0 || idx >= len(l.values) {
		return 0, fmt.Errorf("变量占位符越界")
	}
	return idx, nil
}

func (l *lexer) readIdent() string {
	start := l.pos - 1
	for l.pos < len(l.input) {
		c := l.peek()
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_' {
			l.next()
		} else {
			break
		}
	}
	return l.input[start:l.pos]
}

func (l *lexer) readNumber() string {
	start := l.pos - 1
	for l.pos < len(l.input) {
		c := l.peek()
		if (c >= '0' && c <= '9') || c == '.' {
			l.next()
		} else {
			break
		}
	}
	return l.input[start:l.pos]
}

func (l *lexer) nextToken() (token, error) {
	l.skipWhitespace()
	if l.pos >= len(l.input) {
		return token{typ: tokEOF}, nil
	}
	c := l.next()
	if c == 0x01 {
		// 变量占位符：直接产出值，无需转义与二次扫描
		idx, err := l.readPlaceholder()
		if err != nil {
			return token{}, err
		}
		return token{typ: tokString, val: l.values[idx]}, nil
	}
	switch c {
	case '"':
		s, err := l.readString()
		if err != nil {
			return token{}, err
		}
		return token{typ: tokString, val: s}, nil
	case '(':
		return token{typ: tokLParen}, nil
	case ')':
		return token{typ: tokRParen}, nil
	case ',':
		return token{typ: tokComma}, nil
	default:
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' {
			return token{typ: tokIdent, val: l.readIdent()}, nil
		}
		if c >= '0' && c <= '9' {
			return token{typ: tokNumber, val: l.readNumber()}, nil
		}
		return token{}, fmt.Errorf("非法字符: %c", c)
	}
}

type parser struct {
	lex  *lexer
	tok  token
	memo map[string]string
}

func newParser(input string, memo map[string]string, values []string) (*parser, error) {
	p := &parser{lex: newLexer(input, values), memo: memo}
	tok, err := p.lex.nextToken()
	if err != nil {
		return nil, err
	}
	p.tok = tok
	return p, nil
}

func (p *parser) advance() error {
	tok, err := p.lex.nextToken()
	if err != nil {
		return err
	}
	p.tok = tok
	return nil
}

func (p *parser) parseArgs() ([]string, error) {
	var args []string
	if p.tok.typ == tokRParen {
		return args, nil
	}
	for {
		arg, err := p.parseExpr()
		if err != nil {
			return nil, err
		}
		args = append(args, arg)
		if p.tok.typ == tokComma {
			if err := p.advance(); err != nil {
				return nil, err
			}
			continue
		}
		if p.tok.typ == tokRParen {
			break
		}
		return nil, fmt.Errorf("参数列表语法错误")
	}
	return args, nil
}

func (p *parser) parseExpr() (string, error) {
	switch p.tok.typ {
	case tokString, tokNumber:
		val := p.tok.val
		if err := p.advance(); err != nil {
			return "", err
		}
		return val, nil
	case tokIdent:
		name := p.tok.val
		if err := p.advance(); err != nil {
			return "", err
		}
		if p.tok.typ != tokLParen {
			return "", fmt.Errorf("函数调用后缺少括号: %s", name)
		}
		if err := p.advance(); err != nil {
			return "", err
		}
		args, err := p.parseArgs()
		if err != nil {
			return "", err
		}
		if p.tok.typ != tokRParen {
			return "", fmt.Errorf("函数调用缺少右括号: %s", name)
		}
		if err := p.advance(); err != nil {
			return "", err
		}
		return callFunction(name, args, p.memo)
	default:
		return "", fmt.Errorf("公式语法错误")
	}
}

// 非纯函数：调用结果不可缓存（每次调用都可能不同）
var nonCacheableFuncs = map[string]bool{
	"timestamp":    true,
	"timestamp_ms": true,
	"date":         true,
	"uuid":         true,
	"rand_string":  true,
}

// callFunction 带记忆化的函数调用：相同「函数名+参数」的纯函数在一次执行中只计算一次
func callFunction(name string, args []string, memo map[string]string) (string, error) {
	if memo != nil && !nonCacheableFuncs[strings.ToLower(name)] {
		key := strings.ToLower(name) + "\x00" + strings.Join(args, "\x01")
		if v, ok := memo[key]; ok {
			return v, nil
		}
		v, err := callFunctionImpl(name, args)
		if err != nil {
			return "", err
		}
		memo[key] = v
		return v, nil
	}
	return callFunctionImpl(name, args)
}

func callFunctionImpl(name string, args []string) (string, error) {
	require := func(n int) error {
		if len(args) != n {
			return fmt.Errorf("%s 需要 %d 个参数", name, n)
		}
		return nil
	}
	requireMin := func(n int) error {
		if len(args) < n {
			return fmt.Errorf("%s 至少需要 %d 个参数", name, n)
		}
		return nil
	}
	toInt := func(s string) (int64, error) {
		return strconv.ParseInt(strings.TrimSpace(s), 10, 64)
	}
	boolStr := func(b bool) string {
		if b {
			return "true"
		}
		return "false"
	}
	switch strings.ToLower(name) {
	// ----- 哈希 / 签名 -----
	case "md5":
		if err := require(1); err != nil {
			return "", err
		}
		sum := md5.Sum([]byte(args[0]))
		return hex.EncodeToString(sum[:]), nil
	case "sha1":
		if err := require(1); err != nil {
			return "", err
		}
		sum := sha1.Sum([]byte(args[0]))
		return hex.EncodeToString(sum[:]), nil
	case "sha256":
		if err := require(1); err != nil {
			return "", err
		}
		sum := sha256.Sum256([]byte(args[0]))
		return hex.EncodeToString(sum[:]), nil
	case "hmac_md5":
		if err := require(2); err != nil {
			return "", err
		}
		mac := hmac.New(md5.New, []byte(args[0]))
		mac.Write([]byte(args[1]))
		return hex.EncodeToString(mac.Sum(nil)), nil
	case "hmac_sha1":
		if err := require(2); err != nil {
			return "", err
		}
		mac := hmac.New(sha1.New, []byte(args[0]))
		mac.Write([]byte(args[1]))
		return hex.EncodeToString(mac.Sum(nil)), nil
	case "hmac_sha256":
		if err := require(2); err != nil {
			return "", err
		}
		mac := hmac.New(sha256.New, []byte(args[0]))
		mac.Write([]byte(args[1]))
		return hex.EncodeToString(mac.Sum(nil)), nil
	// ----- 哈希 / 签名（原始字节，可组合 base64()/hex()） -----
	case "md5_raw":
		if err := require(1); err != nil {
			return "", err
		}
		sum := md5.Sum([]byte(args[0]))
		return string(sum[:]), nil
	case "sha1_raw":
		if err := require(1); err != nil {
			return "", err
		}
		sum := sha1.Sum([]byte(args[0]))
		return string(sum[:]), nil
	case "sha256_raw":
		if err := require(1); err != nil {
			return "", err
		}
		sum := sha256.Sum256([]byte(args[0]))
		return string(sum[:]), nil
	case "hmac_md5_raw":
		if err := require(2); err != nil {
			return "", err
		}
		mac := hmac.New(md5.New, []byte(args[0]))
		mac.Write([]byte(args[1]))
		return string(mac.Sum(nil)), nil
	case "hmac_sha1_raw":
		if err := require(2); err != nil {
			return "", err
		}
		mac := hmac.New(sha1.New, []byte(args[0]))
		mac.Write([]byte(args[1]))
		return string(mac.Sum(nil)), nil
	case "hmac_sha256_raw":
		if err := require(2); err != nil {
			return "", err
		}
		mac := hmac.New(sha256.New, []byte(args[0]))
		mac.Write([]byte(args[1]))
		return string(mac.Sum(nil)), nil
	// ----- SHA-512 系列 -----
	case "sha512":
		if err := require(1); err != nil {
			return "", err
		}
		sum := sha512.Sum512([]byte(args[0]))
		return hex.EncodeToString(sum[:]), nil
	case "sha512_raw":
		if err := require(1); err != nil {
			return "", err
		}
		sum := sha512.Sum512([]byte(args[0]))
		return string(sum[:]), nil
	case "hmac_sha512":
		if err := require(2); err != nil {
			return "", err
		}
		mac := hmac.New(sha512.New, []byte(args[0]))
		mac.Write([]byte(args[1]))
		return hex.EncodeToString(mac.Sum(nil)), nil
	case "hmac_sha512_raw":
		if err := require(2); err != nil {
			return "", err
		}
		mac := hmac.New(sha512.New, []byte(args[0]))
		mac.Write([]byte(args[1]))
		return string(mac.Sum(nil)), nil
	// ----- RSA 签名（PKCS1v15，base64 输出） -----
	case "rsa_sha256":
		if err := require(2); err != nil {
			return "", err
		}
		return rsaSignBase64(args[0], args[1], "sha256")
	case "rsa_sha1":
		if err := require(2); err != nil {
			return "", err
		}
		return rsaSignBase64(args[0], args[1], "sha1")
	case "rsa_sign":
		// 通用签名：rsa_sign("私钥PEM", "md5|sha1|sha256|sha512", "文本")
		if err := require(3); err != nil {
			return "", err
		}
		return rsaSignBase64(args[0], args[2], args[1])
	case "rsa_sign_raw":
		// 通用签名原始字节，可组合 hex()/base64()
		if err := require(3); err != nil {
			return "", err
		}
		return rsaSignRaw(args[0], args[2], args[1])
	// ----- RSA 加解密（PKCS1v15） -----
	case "rsa_enc":
		if err := require(2); err != nil {
			return "", err
		}
		return rsaEncryptBase64(args[0], args[1])
	case "rsa_dec":
		if err := require(2); err != nil {
			return "", err
		}
		return rsaDecryptBase64(args[0], args[1])
	// ----- 国密 SM2/SM3/SM4 -----
	case "sm3":
		if err := require(1); err != nil {
			return "", err
		}
		return sm3Hex(args[0]), nil
	case "sm3_raw":
		if err := require(1); err != nil {
			return "", err
		}
		return string(sm3Sum(args[0])), nil
	case "hmac_sm3":
		if err := require(2); err != nil {
			return "", err
		}
		return hmacSM3Hex(args[0], args[1]), nil
	case "hmac_sm3_raw":
		if err := require(2); err != nil {
			return "", err
		}
		return hmacSM3Raw(args[0], args[1]), nil
	case "sm2_sign":
		if err := require(2); err != nil {
			return "", err
		}
		sig, err := sm2SignRaw(args[0], args[1])
		if err != nil {
			return "", err
		}
		return base64.StdEncoding.EncodeToString([]byte(sig)), nil
	case "sm2_sign_raw":
		if err := require(2); err != nil {
			return "", err
		}
		return sm2SignRaw(args[0], args[1])
	case "sm2_enc":
		if err := require(2); err != nil {
			return "", err
		}
		return sm2EncryptBase64(args[0], args[1])
	case "sm2_dec":
		if err := require(2); err != nil {
			return "", err
		}
		return sm2DecryptBase64(args[0], args[1])
	case "sm4_ecb_enc":
		if err := require(2); err != nil {
			return "", err
		}
		return sm4ECBEncrypt(args[0], args[1])
	case "sm4_ecb_dec":
		if err := require(2); err != nil {
			return "", err
		}
		return sm4ECBDecrypt(args[0], args[1])
	case "sm4_cbc_enc":
		if err := require(3); err != nil {
			return "", err
		}
		return sm4CBCEncrypt(args[0], args[1], args[2])
	case "sm4_cbc_dec":
		if err := require(3); err != nil {
			return "", err
		}
		return sm4CBCDecrypt(args[0], args[1], args[2])
	// ----- AES 加解密（PKCS7 填充，base64 输入输出） -----
	case "aes_cbc_enc":
		if err := require(3); err != nil {
			return "", err
		}
		return aesCBCEncrypt(args[0], args[1], args[2])
	case "aes_cbc_dec":
		if err := require(3); err != nil {
			return "", err
		}
		return aesCBCDecrypt(args[0], args[1], args[2])
	case "aes_ecb_enc":
		if err := require(2); err != nil {
			return "", err
		}
		return aesECBEncrypt(args[0], args[1])
	case "aes_ecb_dec":
		if err := require(2); err != nil {
			return "", err
		}
		return aesECBDecrypt(args[0], args[1])
	// ----- 编码 -----
	case "base64":
		if err := require(1); err != nil {
			return "", err
		}
		return base64.StdEncoding.EncodeToString([]byte(args[0])), nil
	case "base64_urlsafe":
		if err := require(1); err != nil {
			return "", err
		}
		return base64.URLEncoding.EncodeToString([]byte(args[0])), nil
	case "base64_decode":
		if err := require(1); err != nil {
			return "", err
		}
		b, err := base64.StdEncoding.DecodeString(args[0])
		if err != nil {
			return "", fmt.Errorf("base64_decode 解码失败: %w", err)
		}
		return string(b), nil
	case "hex":
		if err := require(1); err != nil {
			return "", err
		}
		return hex.EncodeToString([]byte(args[0])), nil
	case "hex_decode":
		if err := require(1); err != nil {
			return "", err
		}
		b, err := hex.DecodeString(args[0])
		if err != nil {
			return "", fmt.Errorf("hex_decode 解码失败: %w", err)
		}
		return string(b), nil
	case "urlencode":
		if err := require(1); err != nil {
			return "", err
		}
		return url.QueryEscape(args[0]), nil
	case "urldecode":
		if err := require(1); err != nil {
			return "", err
		}
		return url.QueryUnescape(args[0])
	case "json_escape":
		// 把字符串转义为可直接嵌入 JSON 字符串字面量的形式（不含首尾引号）
		if err := require(1); err != nil {
			return "", err
		}
		b, err := json.Marshal(args[0])
		if err != nil {
			return "", err
		}
		s := string(b)
		if len(s) >= 2 {
			s = s[1 : len(s)-1]
		}
		return s, nil
	// ----- 字符串 -----
	case "concat":
		if err := requireMin(1); err != nil {
			return "", err
		}
		return strings.Join(args, ""), nil
	case "upper":
		if err := require(1); err != nil {
			return "", err
		}
		return strings.ToUpper(args[0]), nil
	case "lower":
		if err := require(1); err != nil {
			return "", err
		}
		return strings.ToLower(args[0]), nil
	case "replace":
		if err := require(3); err != nil {
			return "", err
		}
		return strings.ReplaceAll(args[0], args[1], args[2]), nil
	case "trim":
		if err := require(1); err != nil {
			return "", err
		}
		return strings.TrimSpace(args[0]), nil
	case "substr":
		if err := require(3); err != nil {
			return "", err
		}
		runes := []rune(args[0])
		start, err := toInt(args[1])
		if err != nil {
			return "", fmt.Errorf("substr start 参数错误: %s", args[1])
		}
		length, err := toInt(args[2])
		if err != nil {
			return "", fmt.Errorf("substr length 参数错误: %s", args[2])
		}
		if start < 0 {
			start = 0
		}
		if start > int64(len(runes)) {
			start = int64(len(runes))
		}
		end := int64(len(runes))
		if length >= 0 && start+length < end {
			end = start + length
		}
		return string(runes[start:end]), nil
	case "len":
		if err := require(1); err != nil {
			return "", err
		}
		return strconv.Itoa(len([]rune(args[0]))), nil
	case "split":
		if err := require(3); err != nil {
			return "", err
		}
		idx, err := toInt(args[2])
		if err != nil {
			return "", fmt.Errorf("split 下标参数错误: %s", args[2])
		}
		parts := strings.Split(args[0], args[1])
		if idx < 0 || idx >= int64(len(parts)) {
			return "", fmt.Errorf("split 下标越界: %d (共 %d 段)", idx, len(parts))
		}
		return parts[idx], nil
	case "regex":
		if err := require(2); err != nil {
			return "", err
		}
		re, err := regexp.Compile(args[1])
		if err != nil {
			return "", fmt.Errorf("regex 正则编译失败: %w", err)
		}
		m := re.FindStringSubmatch(args[0])
		if len(m) > 1 {
			return m[1], nil
		}
		if len(m) > 0 {
			return m[0], nil
		}
		return "", nil
	// ----- 逻辑 -----
	case "contains":
		if err := require(2); err != nil {
			return "", err
		}
		return boolStr(strings.Contains(args[0], args[1])), nil
	case "has_prefix":
		if err := require(2); err != nil {
			return "", err
		}
		return boolStr(strings.HasPrefix(args[0], args[1])), nil
	case "has_suffix":
		if err := require(2); err != nil {
			return "", err
		}
		return boolStr(strings.HasSuffix(args[0], args[1])), nil
	case "eq":
		if err := require(2); err != nil {
			return "", err
		}
		return boolStr(args[0] == args[1]), nil
	case "ne":
		if err := require(2); err != nil {
			return "", err
		}
		return boolStr(args[0] != args[1]), nil
	case "if":
		if err := require(3); err != nil {
			return "", err
		}
		cond := strings.ToLower(strings.TrimSpace(args[0]))
		if cond == "true" || cond == "1" {
			return args[1], nil
		}
		return args[2], nil
	// ----- 时间 / 随机 -----
	case "timestamp":
		return strconv.FormatInt(time.Now().Unix(), 10), nil
	case "timestamp_ms":
		return strconv.FormatInt(time.Now().UnixMilli(), 10), nil
	case "date":
		// 支持 yyyy-MM-dd HH:mm:ss 风格占位符
		if err := require(1); err != nil {
			return "", err
		}
		layout := args[0]
		for _, r := range [][2]string{
			{"yyyy", "2006"}, {"yy", "06"},
			{"MM", "01"}, {"dd", "02"},
			{"HH", "15"}, {"hh", "03"},
			{"mm", "04"}, {"ss", "05"},
		} {
			layout = strings.ReplaceAll(layout, r[0], r[1])
		}
		return time.Now().Format(layout), nil
	case "uuid":
		return uuid.NewString(), nil
	case "rand_string":
		if err := require(1); err != nil {
			return "", err
		}
		n, err := toInt(args[0])
		if err != nil || n <= 0 {
			return "", fmt.Errorf("rand_string 长度参数错误: %s", args[0])
		}
		if n > 256 {
			n = 256
		}
		const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
		buf := make([]byte, n)
		if _, err := rand.Read(buf); err != nil {
			return "", err
		}
		for i := range buf {
			buf[i] = alphabet[int(buf[i])%len(alphabet)]
		}
		return string(buf), nil
	// ----- 整数运算 -----
	case "add", "sub", "mul", "div", "mod":
		if err := require(2); err != nil {
			return "", err
		}
		a, err := toInt(args[0])
		if err != nil {
			return "", fmt.Errorf("%s 参数不是整数: %s", name, args[0])
		}
		b, err := toInt(args[1])
		if err != nil {
			return "", fmt.Errorf("%s 参数不是整数: %s", name, args[1])
		}
		switch name {
		case "add":
			return strconv.FormatInt(a+b, 10), nil
		case "sub":
			return strconv.FormatInt(a-b, 10), nil
		case "mul":
			return strconv.FormatInt(a*b, 10), nil
		case "div":
			if b == 0 {
				return "", fmt.Errorf("div 除数不能为 0")
			}
			return strconv.FormatInt(a/b, 10), nil
		default: // mod
			if b == 0 {
				return "", fmt.Errorf("mod 除数不能为 0")
			}
			return strconv.FormatInt(a%b, 10), nil
		}
	default:
		return "", fmt.Errorf("未知函数: %s", name)
	}
}

// pathPartRe 路径片段："list" → 键； "list[2]" → 键+下标； "[2]" → 仅下标（根数组）。
// 键名允许除方括号外的任意字符（如 HTTP 头 X-Auth、Content-Type）。
var pathPartRe = regexp.MustCompile(`^([^\[\]]*)\[(\d+)\]$`)

func parsePathPart(part string) (key string, idx int, isIndex bool) {
	if m := pathPartRe.FindStringSubmatch(part); m != nil {
		idx, _ = strconv.Atoi(m[2])
		return m[1], idx, true
	}
	return part, 0, false
}

func jsonPathExtract(jsonStr, path string) (string, error) {
	var data interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		return "", fmt.Errorf("jsonpath JSON 解析失败: %w", err)
	}
	return jsonPathExtractDoc(data, path)
}

// jsonPathExtractDoc 在已解析的 JSON 文档上按路径取值（调用方复用文档时可避免重复解析）
func jsonPathExtractDoc(data interface{}, path string) (string, error) {
	parts := strings.Split(path, ".")
	cur := data
	for _, part := range parts {
		if part == "" {
			continue
		}
		// 字符串里嵌套 JSON：需要继续下钻时自动再解析一层（如 {"data": "{\"token\":\"t1\"}"}）
		if s, ok := cur.(string); ok {
			trimmed := strings.TrimSpace(s)
			if strings.HasPrefix(trimmed, "{") || strings.HasPrefix(trimmed, "[") {
				var nested interface{}
				if err := json.Unmarshal([]byte(trimmed), &nested); err == nil {
					cur = nested
				}
			}
		}
		key, idx, isIndex := parsePathPart(part)
		if isIndex {
			if key != "" {
				m, ok := cur.(map[string]interface{})
				if !ok {
					return "", fmt.Errorf("jsonpath 路径 %s 不是对象", key)
				}
				v, ok := m[key]
				if !ok {
					return "", fmt.Errorf("jsonpath 路径 %s 不存在", key)
				}
				cur = v
			}
			arr, ok := cur.([]interface{})
			if !ok {
				return "", fmt.Errorf("jsonpath 路径 %s 不是数组", part)
			}
			if idx < 0 || idx >= len(arr) {
				return "", fmt.Errorf("jsonpath 数组越界: %s", part)
			}
			cur = arr[idx]
			continue
		}
		m, ok := cur.(map[string]interface{})
		if !ok {
			return "", fmt.Errorf("jsonpath 路径 %s 不是对象", part)
		}
		v, ok := m[key]
		if !ok {
			return "", fmt.Errorf("jsonpath 路径 %s 不存在", part)
		}
		cur = v
	}
	// 对象/数组序列化回 JSON 字符串，便于后续步骤引用或公式再次解析；其余转字符串
	switch v := cur.(type) {
	case map[string]interface{}, []interface{}:
		b, err := json.Marshal(v)
		if err != nil {
			return "", fmt.Errorf("jsonpath 结果序列化失败: %w", err)
		}
		return string(b), nil
	case nil:
		return "", nil
	default:
		return fmt.Sprintf("%v", cur), nil
	}
}

// EvaluateFormula 计算公式，公式中的 {{var}} 会先从 ctx 取值
func EvaluateFormula(formula string, ctx map[string]string) (string, error) {
	return evaluateFormulaMemo(formula, ctx, nil)
}

// evaluateFormulaMemo 同 EvaluateFormula，memo 非空时对纯函数调用结果做记忆化
func evaluateFormulaMemo(formula string, ctx map[string]string, memo map[string]string) (string, error) {
	formula = strings.TrimSpace(formula)
	if formula == "" {
		return "", nil
	}
	// 把 {{var}} 换成占位符 \x01<idx>\x02，值进表——词法器直接取值，避免大值转义与二次扫描
	var values []string
	expr := variableRegex.ReplaceAllStringFunc(formula, func(match string) string {
		key := variableRegex.FindStringSubmatch(match)[1]
		if v, ok := ctx[key]; ok {
			values = append(values, v)
			return "\x01" + strconv.Itoa(len(values)-1) + "\x02"
		}
		return match
	})
	p, err := newParser(expr, memo, values)
	if err != nil {
		return "", err
	}
	result, err := p.parseExpr()
	if err != nil {
		return "", err
	}
	if p.tok.typ != tokEOF {
		return "", fmt.Errorf("公式末尾有多余内容")
	}
	return result, nil
}

// ============= 请求执行 =============

type context struct {
	vars map[string]string
}

func (c *context) set(name, value string) {
	c.vars[name] = value
}

func (c *context) cloneVars() map[string]string {
	m := make(map[string]string, len(c.vars))
	for k, v := range c.vars {
		m[k] = v
	}
	return m
}

func executeStep(step Step, ctx *context, logger *public.Logger, memo, processVars, responseVars map[string]string, trace *[]StepResult) error {
	vars := ctx.cloneVars()

	method := strings.ToUpper(step.Method)
	if method == "" {
		method = http.MethodGet
	}
	reqURL := strings.TrimSpace(replaceVariables(step.Url, vars))
	// 容错：协议后多打一个斜杠的常见手误（http:/// → http://）
	reqURL = strings.Replace(reqURL, ":///", "://", 1)
	if reqURL == "" {
		return fmt.Errorf("步骤 [%s] 请求地址为空", step.Name)
	}
	if !strings.HasPrefix(reqURL, "http://") && !strings.HasPrefix(reqURL, "https://") {
		return fmt.Errorf("步骤 [%s] 请求地址格式不正确（需以 http:// 或 https:// 开头）: %s", step.Name, reqURL)
	}

	// 测试追踪：记录本步并统一登记错误
	var tr *StepResult
	if trace != nil {
		*trace = append(*trace, StepResult{Name: step.Name, Method: method, Url: reqURL})
		tr = &(*trace)[len(*trace)-1]
	}
	recordErr := func(err error) error {
		if tr != nil {
			tr.Error = err.Error()
		}
		return err
	}

	timeout := time.Duration(step.Timeout) * time.Second
	if timeout <= 0 {
		timeout = 15 * time.Second
	}
	client := resty.New().SetTimeout(timeout)
	if step.Insecure {
		// 忽略 SSL 证书校验（自签/内网证书）
		client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	}
	req := client.R()

	// headers
	for _, h := range step.Headers {
		if h.Key == "" {
			continue
		}
		req.SetHeader(replaceVariables(h.Key, vars), replaceVariables(h.Value, vars))
	}
	// cookies
	for _, ck := range step.Cookies {
		if ck.Key == "" {
			continue
		}
		req.SetCookie(&http.Cookie{Name: replaceVariables(ck.Key, vars), Value: replaceVariables(ck.Value, vars)})
	}
	// query params
	for _, p := range step.Params {
		if p.Key == "" {
			continue
		}
		req.SetQueryParam(replaceVariables(p.Key, vars), replaceVariables(p.Value, vars))
	}

	// body：仅 POST 请求生效，内容原样发送（不重序列化、不自动补 Content-Type，类型由请求头配置决定）
	bodyStr := replaceVariables(step.Body, vars)
	if method == http.MethodPost && bodyStr != "" {
		req.SetBody(bodyStr)
	}

	if logger != nil {
		logger.Debug(fmt.Sprintf("CustomApi step [%s] %s %s", step.Name, method, reqURL))
	}

	resp, err := req.Execute(method, reqURL)
	if err != nil {
		return recordErr(fmt.Errorf("步骤 [%s] 请求失败: %w", step.Name, err))
	}

	respBody := resp.String()
	// 测试追踪：登记状态码与原始响应体（截断）
	if tr != nil {
		tr.Status = resp.StatusCode()
		tr.Body = truncateTrace(respBody, traceBodyLimit)
	}

	// 解析格式（默认 json），预处理阶段的 raw.xxx 路径按此格式解析
	format := step.Response.Format
	if format == "" {
		format = "json"
	}

	// 响应体文档惰性解析（成功条件/提取/raw.xxx 共享）
	var jsonDoc interface{}
	jsonParsed := false
	getJsonDoc := func() (interface{}, error) {
		if !jsonParsed {
			jsonParsed = true
			if err := json.Unmarshal([]byte(respBody), &jsonDoc); err != nil {
				return nil, fmt.Errorf("JSON 解析失败: %w", err)
			}
		}
		return jsonDoc, nil
	}
	extract := func(f, path string) (string, error) {
		if f == "" || f == "json" {
			doc, err := getJsonDoc()
			if err != nil {
				return "", err
			}
			return jsonPathExtractDoc(doc, path)
		}
		if f == "xml" {
			return xmlPathExtract(respBody, path)
		}
		return "", fmt.Errorf("不支持的解析格式: %s", f)
	}

	// resolveRawPaths 把公式里未命中变量的 {{xxx}} 按解析格式从响应体取值并注入变量表。
	// 即：{{headers.X-Auth[0]}} 可直接取解析后的路径（也兼容 {{raw.headers.X-Auth[0]}} 前缀写法）。
	resolveRawPaths := func(formula string, scratch map[string]string) error {
		for _, m := range variableRegex.FindAllStringSubmatch(formula, -1) {
			key := m[1]
			if key == "raw" || key == "__raw__" {
				continue
			}
			if _, ok := scratch[key]; ok {
				continue
			}
			path := strings.TrimPrefix(key, "raw.")
			v, err := extract(format, path)
			if err != nil {
				continue // 不是有效路径：留给 missingRefs 报「变量不存在」
			}
			scratch[key] = v
		}
		return nil
	}

	// 响应预处理阶段：按顺序求值预处理变量（{{raw}}/{{__raw__}} 引用当前响应体，raw.xxx 直取解析路径，链式可见）。
	// 作用域与请求分离：仅上游提取/预处理输出可见，请求侧变量（系统变量、步骤变量）不可见。
	// 输出进请求可用上下文与响应变量表，过程进过程表。
	// 约定：名为 __raw__ 或 raw 的变量将替换响应体，后续变量与解析均使用新值。
	// preOut 记录本步预处理产出（含最终 raw），成功条件/提取路径可直接引用其变量名。
	preOut := map[string]string{}
	if len(step.Response.Variables) > 0 {
		scratch := make(map[string]string, len(responseVars)+2)
		for k, v := range responseVars {
			scratch[k] = v
		}
		scratch["__raw__"] = respBody
		scratch["raw"] = respBody
		for _, v := range step.Response.Variables {
			if v.Name == "" {
				continue
			}
			if err := resolveRawPaths(v.Formula, scratch); err != nil {
				return recordErr(fmt.Errorf("步骤 [%s] 预处理变量 [%s] %w", step.Name, v.Name, err))
			}
			if missing := missingRefs(v.Formula, scratch); len(missing) > 0 {
				return recordErr(fmt.Errorf("步骤 [%s] 预处理变量 [%s] 引用了不存在的变量: %s", step.Name, v.Name, strings.Join(missing, ", ")))
			}
			val, err := evaluateFormulaMemo(v.Formula, scratch, memo)
			if err != nil {
				return recordErr(fmt.Errorf("步骤 [%s] 预处理变量 [%s] 公式计算失败: %w", step.Name, v.Name, err))
			}
			key := fmt.Sprintf("var.%s", v.Name)
			if v.Process {
				processVars[key] = val
				processVars[v.Name] = val
			} else {
				ctx.set(key, val)
				ctx.set(v.Name, val)
				responseVars[key] = val
				responseVars[v.Name] = val
			}
			scratch[key] = val
			scratch[v.Name] = val
			preOut[v.Name] = val
			if v.Name == "__raw__" || v.Name == "raw" {
				// 约定：raw/__raw__ 可写，替换响应体
				respBody = val
				scratch["__raw__"] = val
				scratch["raw"] = val
				jsonParsed = false // 响应体已变，重新解析
			}
		}
	}
	preOut["__raw__"] = respBody
	preOut["raw"] = respBody

	// 成功判断：HTTP 状态码
	successCode := step.Response.SuccessCode
	if successCode == 0 {
		successCode = 200
	}
	if resp.StatusCode() != successCode {
		return recordErr(fmt.Errorf("步骤 [%s] 返回状态码 %d, body: %s", step.Name, resp.StatusCode(), respBody))
	}

	// 成功判断：响应内容条件（可选）；字段可直接写预处理变量名，否则按解析格式从响应体取值
	if cond := step.Response.Condition; cond != nil && cond.Field != "" {
		var actual string
		if pv, ok := preOut[cond.Field]; ok {
			actual = pv
		} else {
			var err error
			actual, err = extract(format, cond.Field)
			if err != nil {
				return recordErr(fmt.Errorf("步骤 [%s] 成功条件字段 [%s] 解析失败: %w", step.Name, cond.Field, err))
			}
		}
		ok, err := compareCondition(actual, cond.Operator, cond.Value)
		if err != nil {
			return recordErr(fmt.Errorf("步骤 [%s] 成功条件比较失败: %w", step.Name, err))
		}
		if !ok {
			return recordErr(fmt.Errorf("步骤 [%s] 成功条件不满足: %s %s %q (实际值: %q)", step.Name, cond.Field, operatorText(cond.Operator), cond.Value, actual))
		}
	}

	// 提取响应变量；路径可直接写预处理变量名，否则按解析格式从响应体取值
	for _, ext := range step.Response.Extracts {
		if ext.Name == "" {
			continue
		}
		var val string
		if pv, ok := preOut[ext.Path]; ok {
			val = pv
		} else {
			var err error
			val, err = extract(format, ext.Path)
			if err != nil {
				return recordErr(fmt.Errorf("步骤 [%s] %s 提取失败: %w", step.Name, ext.Name, err))
			}
		}
		fullKey := fmt.Sprintf("%s.%s", step.Name, ext.Name)
		shortKey := fmt.Sprintf("step.%s", ext.Name)
		// 提取值同时进响应变量表，供后续步骤的预处理（响应阶段）使用
		responseVars[fullKey] = val
		responseVars[shortKey] = val
		responseVars[ext.Name] = val
		// 测试追踪：登记提取的变量（值截断）
		if tr != nil {
			if tr.Extracts == nil {
				tr.Extracts = map[string]string{}
			}
			tr.Extracts[ext.Name] = truncateTrace(val, traceExtractLimit)
		}
		if ext.Process {
			// 过程变量：仅公式计算可见，不进入请求可用变量
			processVars[fullKey] = val
			processVars[shortKey] = val
			processVars[ext.Name] = val
		} else {
			ctx.set(fullKey, val)
			ctx.set(shortKey, val) // 兼容简写
			ctx.set(ext.Name, val) // 裸变量名，后续步骤直接 {{变量名}} 引用（同名后者覆盖）
		}
	}

	return nil
}

// operatorText 返回比较运算符的可读文本
func operatorText(op string) string {
	switch op {
	case "ne":
		return "!="
	case "contains":
		return "应包含"
	case "not_contains":
		return "不应包含"
	case "gt":
		return ">"
	case "lt":
		return "<"
	default:
		return "=="
	}
}

// compareCondition 比较解析值与期望值：eq|ne|contains|not_contains|gt|lt（默认 eq）
func compareCondition(actual, operator, expect string) (bool, error) {
	switch operator {
	case "", "eq":
		return actual == expect, nil
	case "ne":
		return actual != expect, nil
	case "contains":
		return strings.Contains(actual, expect), nil
	case "not_contains":
		return !strings.Contains(actual, expect), nil
	case "gt", "lt":
		a, err := strconv.ParseFloat(strings.TrimSpace(actual), 64)
		if err != nil {
			return false, fmt.Errorf("解析值 %q 不是数字", actual)
		}
		e, err := strconv.ParseFloat(strings.TrimSpace(expect), 64)
		if err != nil {
			return false, fmt.Errorf("期望值 %q 不是数字", expect)
		}
		if operator == "gt" {
			return a > e, nil
		}
		return a < e, nil
	default:
		return false, fmt.Errorf("未知的比较运算符: %s", operator)
	}
}

// StepResult 单步执行结果（测试展示用）
type StepResult struct {
	Name     string            `json:"name"`
	Method   string            `json:"method"`
	Url      string            `json:"url"`
	Status   int               `json:"status"`
	Body     string            `json:"body"`
	Extracts map[string]string `json:"extracts,omitempty"`
	Error    string            `json:"error,omitempty"`
}

const (
	traceBodyLimit    = 4096
	traceExtractLimit = 1024
)

// truncateTrace 截断超长内容用于展示
func truncateTrace(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + fmt.Sprintf("...（共 %d 字符）", len(s))
}

// ExecuteTrace 同 Execute，但记录每个步骤的执行结果（测试按钮展示用）。
// 中途失败时返回已记录的部分结果与错误。
func ExecuteTrace(cfg *Config, vars map[string]string, logger *public.Logger) ([]StepResult, map[string]string, error) {
	trace := make([]StepResult, 0, len(cfg.Steps))
	finalVars, err := execute(cfg, vars, logger, &trace)
	return trace, finalVars, err
}

// Execute 执行自定义API配置：
// 注入 vars → 评估自定义变量 → 依次执行多步请求 → 返回最终变量上下文。
// 自定义变量可引用已执行步骤提取的变量（如 {{step1.token}}），引用未就绪的变量会延后评估；
// 全部步骤执行完后仍无法解析的引用将报错。
func Execute(cfg *Config, vars map[string]string, logger *public.Logger) (map[string]string, error) {
	return execute(cfg, vars, logger, nil)
}

func execute(cfg *Config, vars map[string]string, logger *public.Logger, trace *[]StepResult) (map[string]string, error) {
	if cfg == nil {
		return nil, fmt.Errorf("缺少配置")
	}
	ctx := &context{vars: make(map[string]string)}
	for k, v := range vars {
		ctx.set(k, v)
	}
	// 公式调用记忆化：同一次执行中相同「函数+参数」的纯函数只计算一次
	memo := make(map[string]string)
	// 过程变量表：公式计算可见，但不进入请求可用变量，Execute 结束即弃
	processVars := make(map[string]string)
	// 响应变量表：各步提取与预处理输出，响应阶段（预处理）可见；与请求变量分离
	responseVars := make(map[string]string)

	pending := make([]Variable, 0, len(cfg.Variables))
	for _, v := range cfg.Variables {
		if v.Name != "" {
			pending = append(pending, v)
		}
	}

	// 评估变量列表：fatal=false 时引用未就绪的变量延后（返回剩余）；fatal=true 时未就绪即报错。
	// 求值链上下文 = 请求可用变量 + 过程变量；过程变量只进过程表。
	evalVars := func(list []Variable, fatal bool) ([]Variable, error) {
		scratch := ctx.cloneVars()
		for k, v := range processVars {
			scratch[k] = v
		}
		var next []Variable
		for _, v := range list {
			if missing := missingRefs(v.Formula, scratch); len(missing) > 0 {
				if fatal {
					return nil, fmt.Errorf("自定义变量 [%s] 引用了不存在的变量: %s", v.Name, strings.Join(missing, ", "))
				}
				next = append(next, v) // 引用未就绪，延后评估
				continue
			}
			val, err := evaluateFormulaMemo(v.Formula, scratch, memo)
			if err != nil {
				return nil, fmt.Errorf("自定义变量 [%s] 公式计算失败: %w", v.Name, err)
			}
			key := fmt.Sprintf("var.%s", v.Name)
			if v.Process {
				processVars[key] = val
				processVars[v.Name] = val
				scratch[key] = val
				scratch[v.Name] = val
			} else {
				ctx.set(key, val)
				ctx.set(v.Name, val) // 同时支持简写
				scratch[key] = val
				scratch[v.Name] = val
			}
		}
		return next, nil
	}

	var err error
	if pending, err = evalVars(pending, false); err != nil {
		return nil, err
	}

	// 执行多步请求：先求值步骤级变量（每步请求前重新计算），再执行请求，最后补评估引用已就绪的全局变量
	for _, step := range cfg.Steps {
		if step.Name == "" {
			continue
		}
		// 执行条件：公式结果为 true/1 才执行（如 DNS 场景按 action 区分两套接口）
		if when := strings.TrimSpace(step.When); when != "" {
			condVal, err := evaluateFormulaMemo(when, ctx.cloneVars(), memo)
			condVal = strings.ToLower(strings.TrimSpace(condVal))
			if err != nil {
				return nil, fmt.Errorf("步骤 [%s] 执行条件计算失败: %w", step.Name, err)
			}
			if condVal != "true" && condVal != "1" {
				if logger != nil {
					logger.Debug(fmt.Sprintf("CustomApi step [%s] 条件不满足（%s），跳过", step.Name, step.When))
				}
				continue
			}
		}
		if len(step.Variables) > 0 {
			if _, err = evalVars(step.Variables, true); err != nil {
				return nil, fmt.Errorf("步骤 [%s] %w", step.Name, err)
			}
		}
		if err := executeStep(step, ctx, logger, memo, processVars, responseVars, trace); err != nil {
			return nil, err
		}
		if pending, err = evalVars(pending, false); err != nil {
			return nil, err
		}
	}

	if _, err = evalVars(pending, true); err != nil {
		return nil, err
	}

	return ctx.cloneVars(), nil
}

// missingRefs 返回公式中引用了但 vars 里不存在的变量名
func missingRefs(formula string, vars map[string]string) []string {
	var missing []string
	for _, m := range variableRegex.FindAllStringSubmatch(formula, -1) {
		if _, ok := vars[m[1]]; !ok {
			missing = append(missing, "{{"+m[1]+"}}")
		}
	}
	return missing
}
