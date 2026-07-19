package customapi

import (
	"crypto"
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"strings"
)

// derFromPEMOrBase64 提取 DER 字节：支持完整 PEM（含 BEGIN/END 头尾），
// 也兼容只有 base64 主体的内容（自动去空白后解码）
func derFromPEMOrBase64(s string) ([]byte, error) {
	if block, _ := pem.Decode([]byte(s)); block != nil {
		return block.Bytes, nil
	}
	compact := strings.Map(func(r rune) rune {
		switch r {
		case ' ', '\t', '\r', '\n':
			return -1
		}
		return r
	}, s)
	der, err := base64.StdEncoding.DecodeString(compact)
	if err != nil {
		return nil, fmt.Errorf("密钥格式错误（需要完整 PEM 或 base64 内容）")
	}
	return der, nil
}

// ============= RSA 签名（PKCS1v15，base64 输出） =============

// parseRSAPrivateKey 解析 RSA 私钥，兼容 PKCS1/PKCS8，支持完整 PEM 或纯 base64 内容
func parseRSAPrivateKey(keyPEM string) (*rsa.PrivateKey, error) {
	der, err := derFromPEMOrBase64(keyPEM)
	if err != nil {
		return nil, fmt.Errorf("不是有效的私钥: %w", err)
	}
	if key, err := x509.ParsePKCS1PrivateKey(der); err == nil {
		return key, nil
	}
	keyAny, err := x509.ParsePKCS8PrivateKey(der)
	if err != nil {
		return nil, fmt.Errorf("私钥解析失败(支持 PKCS1/PKCS8): %w", err)
	}
	key, ok := keyAny.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("不是 RSA 私钥")
	}
	return key, nil
}

// rsaSignRaw 用 RSA 私钥对文本做 PKCS1v15 签名，返回原始签名字节
// algo: "md5" | "sha1" | "sha256"（RSA2）| "sha512"
func rsaSignRaw(keyPEM, text, algo string) (string, error) {
	key, err := parseRSAPrivateKey(keyPEM)
	if err != nil {
		return "", err
	}
	var hash crypto.Hash
	var digest []byte
	switch algo {
	case "sha256":
		hash = crypto.SHA256
		sum := sha256.Sum256([]byte(text))
		digest = sum[:]
	case "sha1":
		hash = crypto.SHA1
		sum := sha1.Sum([]byte(text))
		digest = sum[:]
	case "sha512":
		hash = crypto.SHA512
		sum := sha512.Sum512([]byte(text))
		digest = sum[:]
	case "md5":
		hash = crypto.MD5
		sum := md5.Sum([]byte(text))
		digest = sum[:]
	default:
		return "", fmt.Errorf("不支持的签名算法: %s (支持 md5/sha1/sha256/sha512)", algo)
	}
	sig, err := rsa.SignPKCS1v15(rand.Reader, key, hash, digest)
	if err != nil {
		return "", fmt.Errorf("RSA 签名失败: %w", err)
	}
	return string(sig), nil
}

// rsaSignBase64 用 RSA 私钥对文本做 PKCS1v15 签名，返回 base64
func rsaSignBase64(keyPEM, text, algo string) (string, error) {
	sig, err := rsaSignRaw(keyPEM, text, algo)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString([]byte(sig)), nil
}

// parseRSAPublicKey 解析 RSA 公钥，兼容 PKIX/PKCS1 公钥及证书，支持完整 PEM 或纯 base64 内容
func parseRSAPublicKey(pubPEM string) (*rsa.PublicKey, error) {
	der, err := derFromPEMOrBase64(pubPEM)
	if err != nil {
		return nil, fmt.Errorf("不是有效的公钥: %w", err)
	}
	if pubAny, err := x509.ParsePKIXPublicKey(der); err == nil {
		if k, ok := pubAny.(*rsa.PublicKey); ok {
			return k, nil
		}
	}
	if k, err := x509.ParsePKCS1PublicKey(der); err == nil {
		return k, nil
	}
	if c, err := x509.ParseCertificate(der); err == nil {
		if k, ok := c.PublicKey.(*rsa.PublicKey); ok {
			return k, nil
		}
	}
	return nil, fmt.Errorf("不是有效的 RSA 公钥或证书")
}

// rsaEncryptBase64 用 RSA 公钥加密（PKCS1v15），返回 base64
func rsaEncryptBase64(pubPEM, plaintext string) (string, error) {
	pub, err := parseRSAPublicKey(pubPEM)
	if err != nil {
		return "", err
	}
	maxLen := pub.N.BitLen()/8 - 11
	if len(plaintext) > maxLen {
		return "", fmt.Errorf("明文过长，RSA 单次最多加密 %d 字节", maxLen)
	}
	ct, err := rsa.EncryptPKCS1v15(rand.Reader, pub, []byte(plaintext))
	if err != nil {
		return "", fmt.Errorf("RSA 加密失败: %w", err)
	}
	return base64.StdEncoding.EncodeToString(ct), nil
}

// rsaDecryptBase64 用 RSA 私钥解密（PKCS1v15），输入 base64 密文
func rsaDecryptBase64(keyPEM, ciphertextB64 string) (string, error) {
	key, err := parseRSAPrivateKey(keyPEM)
	if err != nil {
		return "", err
	}
	raw, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return "", fmt.Errorf("密文 base64 解码失败: %w", err)
	}
	pt, err := rsa.DecryptPKCS1v15(rand.Reader, key, raw)
	if err != nil {
		return "", fmt.Errorf("RSA 解密失败: %w", err)
	}
	return string(pt), nil
}

// ============= AES 加解密（PKCS7 填充，base64 输入输出） =============

func pkcs7Pad(data []byte, blockSize int) []byte {
	pad := blockSize - len(data)%blockSize
	out := make([]byte, len(data)+pad)
	copy(out, data)
	for i := len(data); i < len(out); i++ {
		out[i] = byte(pad)
	}
	return out
}

func pkcs7Unpad(data []byte, blockSize int) ([]byte, error) {
	if len(data) == 0 || len(data)%blockSize != 0 {
		return nil, fmt.Errorf("数据长度不是块大小的整数倍")
	}
	pad := int(data[len(data)-1])
	if pad == 0 || pad > blockSize || pad > len(data) {
		return nil, fmt.Errorf("PKCS7 填充无效")
	}
	for i := len(data) - pad; i < len(data); i++ {
		if int(data[i]) != pad {
			return nil, fmt.Errorf("PKCS7 填充无效")
		}
	}
	return data[:len(data)-pad], nil
}

func newAESCipher(key string) (cipher.Block, error) {
	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return nil, fmt.Errorf("AES 密钥长度须为 16/24/32 字节: %w", err)
	}
	return block, nil
}

// aesCBCEncrypt AES-CBC 加密，key/iv 为原文（iv 16 字节），返回 base64
func aesCBCEncrypt(key, iv, plaintext string) (string, error) {
	block, err := newAESCipher(key)
	if err != nil {
		return "", err
	}
	if len(iv) != block.BlockSize() {
		return "", fmt.Errorf("AES-CBC 的 IV 长度必须为 %d 字节", block.BlockSize())
	}
	data := pkcs7Pad([]byte(plaintext), block.BlockSize())
	out := make([]byte, len(data))
	cipher.NewCBCEncrypter(block, []byte(iv)).CryptBlocks(out, data)
	return base64.StdEncoding.EncodeToString(out), nil
}

// aesCBCDecrypt AES-CBC 解密，输入 base64 密文
func aesCBCDecrypt(key, iv, ciphertextB64 string) (string, error) {
	block, err := newAESCipher(key)
	if err != nil {
		return "", err
	}
	if len(iv) != block.BlockSize() {
		return "", fmt.Errorf("AES-CBC 的 IV 长度必须为 %d 字节", block.BlockSize())
	}
	raw, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return "", fmt.Errorf("密文 base64 解码失败: %w", err)
	}
	if len(raw) == 0 || len(raw)%block.BlockSize() != 0 {
		return "", fmt.Errorf("密文长度不是块大小的整数倍")
	}
	out := make([]byte, len(raw))
	cipher.NewCBCDecrypter(block, []byte(iv)).CryptBlocks(out, raw)
	data, err := pkcs7Unpad(out, block.BlockSize())
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// aesECBEncrypt AES-ECB 加密，返回 base64
func aesECBEncrypt(key, plaintext string) (string, error) {
	block, err := newAESCipher(key)
	if err != nil {
		return "", err
	}
	data := pkcs7Pad([]byte(plaintext), block.BlockSize())
	out := make([]byte, len(data))
	bs := block.BlockSize()
	for i := 0; i < len(data); i += bs {
		block.Encrypt(out[i:i+bs], data[i:i+bs])
	}
	return base64.StdEncoding.EncodeToString(out), nil
}

// aesECBDecrypt AES-ECB 解密，输入 base64 密文
func aesECBDecrypt(key, ciphertextB64 string) (string, error) {
	block, err := newAESCipher(key)
	if err != nil {
		return "", err
	}
	raw, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return "", fmt.Errorf("密文 base64 解码失败: %w", err)
	}
	if len(raw) == 0 || len(raw)%block.BlockSize() != 0 {
		return "", fmt.Errorf("密文长度不是块大小的整数倍")
	}
	out := make([]byte, len(raw))
	bs := block.BlockSize()
	for i := 0; i < len(raw); i += bs {
		block.Decrypt(out[i:i+bs], raw[i:i+bs])
	}
	data, err := pkcs7Unpad(out, block.BlockSize())
	if err != nil {
		return "", err
	}
	return string(data), nil
}
