package private_ca

import (
	"crypto"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"math/big"
	"strings"
	"time"
)

// GenerateCRL 为指定 CA（中间 CA 或根 CA）生成 PEM 编码的 CRL。
// 包含该 CA 直接签发的、状态为 revoked 的叶子证书。
// SM2 国密暂不支持 CRL 导出。
func GenerateCRL(caId int64) ([]byte, string, error) {
	if caId <= 0 {
		return nil, "", fmt.Errorf("CA ID 无效")
	}
	s, err := GetSqlite()
	if err != nil {
		return nil, "", err
	}
	defer s.Close()

	cas, err := s.Where("id=?", []interface{}{caId}).Select()
	if err != nil {
		return nil, "", err
	}
	if len(cas) == 0 {
		return nil, "", fmt.Errorf("CA 不存在")
	}
	caRow := cas[0]
	algorithm, _ := caRow["algorithm"].(string)
	if algorithm == "sm2" {
		return nil, "", fmt.Errorf("国密 SM2 证书暂不支持导出 CRL")
	}

	certPEM, _ := caRow["cert"].(string)
	keyPEM, _ := caRow["key"].(string)
	if certPEM == "" || keyPEM == "" {
		return nil, "", fmt.Errorf("CA 证书或私钥为空")
	}

	issuerObj, err := NewCertificateFromPEMStandard([]byte(certPEM), []byte(keyPEM), KeyType(algorithm))
	if err != nil {
		return nil, "", fmt.Errorf("解析 CA 密钥失败: %v", err)
	}
	if issuerObj.Cert == nil {
		return nil, "", fmt.Errorf("CA 证书解析失败")
	}
	signer, ok := issuerObj.Key.(crypto.Signer)
	if !ok {
		return nil, "", fmt.Errorf("CA 私钥不支持签名")
	}

	// 收集该 CA 下已吊销的叶子证书
	s.TableName = "leaf"
	leafs, err := s.Where("ca_id=? and status=?", []interface{}{caId, LeafStatusRevoked}).Select()
	if err != nil {
		return nil, "", err
	}

	var entries []x509.RevocationListEntry
	for _, leaf := range leafs {
		serial, err := resolveLeafSerial(leaf)
		if err != nil || serial == nil {
			continue
		}
		revokedAt := time.Now()
		if v, ok := leaf["revoked_at"].(string); ok && v != "" {
			if t, err := time.Parse("2006-01-02 15:04:05", v); err == nil {
				revokedAt = t
			}
		}
		reasonCode := parseRevokeReasonCode(leaf["revoke_reason"])
		entry := x509.RevocationListEntry{
			SerialNumber:   serial,
			RevocationTime: revokedAt,
		}
		if reasonCode >= 0 {
			entry.ReasonCode = reasonCode
		}
		entries = append(entries, entry)
	}

	now := time.Now()
	template := &x509.RevocationList{
		Number:                    big.NewInt(now.UnixNano()),
		ThisUpdate:                now,
		NextUpdate:                now.Add(7 * 24 * time.Hour),
		RevokedCertificateEntries: entries,
	}

	crlDER, err := x509.CreateRevocationList(rand.Reader, template, issuerObj.Cert, signer)
	if err != nil {
		return nil, "", fmt.Errorf("生成 CRL 失败: %v", err)
	}
	crlPEM := pem.EncodeToMemory(&pem.Block{Type: "X509 CRL", Bytes: crlDER})

	name, _ := caRow["name"].(string)
	if name == "" {
		name, _ = caRow["cn"].(string)
	}
	filename := sanitizeFilename(name) + ".crl"
	return crlPEM, filename, nil
}

func resolveLeafSerial(leaf map[string]any) (*big.Int, error) {
	if sn, ok := leaf["serial_number"].(string); ok && sn != "" {
		serial := new(big.Int)
		// 优先十六进制
		if _, ok := serial.SetString(sn, 16); ok {
			return serial, nil
		}
		if _, ok := serial.SetString(sn, 10); ok {
			return serial, nil
		}
	}
	certPEM, _ := leaf["cert"].(string)
	if certPEM == "" {
		return nil, fmt.Errorf("empty cert")
	}
	certObj, err := publicParseLeafCert(certPEM)
	if err != nil {
		return nil, err
	}
	return certObj.SerialNumber, nil
}

func publicParseLeafCert(certPEM string) (*x509.Certificate, error) {
	block, _ := pem.Decode([]byte(certPEM))
	if block == nil {
		return nil, fmt.Errorf("无法解析证书 PEM")
	}
	return x509.ParseCertificate(block.Bytes)
}

// parseRevokeReasonCode 从存储的原因字符串提取 RFC 原因码；无法识别时返回 -1（不写入 ReasonCode）
func parseRevokeReasonCode(v any) int {
	s, _ := v.(string)
	if s == "" {
		return 0
	}
	// 格式: "keyCompromise" 或 "keyCompromise: note"
	label := s
	if i := strings.Index(s, ":"); i >= 0 {
		label = strings.TrimSpace(s[:i])
	}
	for code, name := range validRevokeReasons {
		if name == label {
			return code
		}
	}
	return 0
}

func sanitizeFilename(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "ca"
	}
	replacer := strings.NewReplacer(
		"/", "_", "\\", "_", ":", "_", "*", "_",
		"?", "_", "\"", "_", "<", "_", ">", "_", "|", "_", " ", "_",
	)
	return replacer.Replace(name)
}
