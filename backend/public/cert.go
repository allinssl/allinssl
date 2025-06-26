package public

import (
	"bytes"
	"crypto"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"fmt"
	"github.com/pavlo-v-chernykh/keystore-go/v4"
	"software.sslmate.com/src/go-pkcs12"
	"strings"
	"time"
)

// **解析 PEM 格式的证书**
func ParseCertificate(certPEM []byte) (*x509.Certificate, error) {
	block, _ := pem.Decode(certPEM)
	if block == nil {
		return nil, fmt.Errorf("无法解析证书 PEM")
	}
	return x509.ParseCertificate(block.Bytes)
}

// **解析 PEM 格式的私钥**
func ParsePrivateKey(keyPEM []byte) (crypto.PrivateKey, error) {
	block, _ := pem.Decode(keyPEM)
	if block == nil {
		return nil, fmt.Errorf("无法解析私钥 PEM")
	}

	// **尝试解析不同类型的私钥**
	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	if key, err := x509.ParseECPrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	if key, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	return nil, fmt.Errorf("无法识别的私钥格式")
}

// **检查证书是否过期**
func CheckCertificateExpiration(cert *x509.Certificate) error {
	now := time.Now()
	if now.Before(cert.NotBefore) {
		return fmt.Errorf("证书尚未生效，有效期开始于: %v", cert.NotBefore)
	}
	if now.After(cert.NotAfter) {
		return fmt.Errorf("证书已过期，有效期截止到: %v", cert.NotAfter)
	}
	return nil
}

// **检查证书是否与私钥匹配**
func VerifyCertificateAndKey(cert *x509.Certificate, privateKey crypto.PrivateKey) error {
	messageARR := sha256.Sum256([]byte("test message"))
	message := messageARR[:]
	var signature []byte
	var err error

	// **用私钥签名数据**
	switch key := privateKey.(type) {
	case *rsa.PrivateKey:
		signature, err = rsa.SignPKCS1v15(nil, key, crypto.SHA256, message)
	case *ecdsa.PrivateKey:
		signature, err = key.Sign(rand.Reader, message, crypto.SHA256)
	case ed25519.PrivateKey:
		signature = ed25519.Sign(key, message)
	default:
		err = errors.New("不支持的私钥类型")
	}
	if err != nil {
		return fmt.Errorf("签名失败: %v", err)
	}

	// **使用公钥验证签名**
	switch pub := cert.PublicKey.(type) {
	case *rsa.PublicKey:
		err = rsa.VerifyPKCS1v15(pub, crypto.SHA256, message, signature)
	case *ecdsa.PublicKey:
		ok := ecdsa.VerifyASN1(pub, message, signature)
		if !ok {
			err = fmt.Errorf("ECDSA 签名验证失败")
		}
	case ed25519.PublicKey:
		if !ed25519.Verify(pub, message, signature) {
			err = fmt.Errorf("Ed25519 签名验证失败")
		}
	default:
		err = fmt.Errorf("不支持的公钥类型: %T", pub)
	}
	return err
}

// **主验证函数**
func ValidateSSLCertificate(certStr, keyStr string) error {
	certPEM, keyPEM := []byte(certStr), []byte(keyStr)
	// **解析证书和私钥**
	cert, err := ParseCertificate(certPEM)
	if err != nil {
		return fmt.Errorf("解析证书失败: %v", err)
	}
	privateKey, err := ParsePrivateKey(keyPEM)
	if err != nil {
		return fmt.Errorf("解析私钥失败: %v", err)
	}

	// **检查证书有效期**
	if err := CheckCertificateExpiration(cert); err != nil {
		return err
	}

	// **检查证书和私钥是否匹配**
	if err := VerifyCertificateAndKey(cert, privateKey); err != nil {
		return fmt.Errorf("证书与私钥不匹配: %v", err)
	}

	return nil
}

// 获取sha256
func GetSHA256(certStr string) (string, error) {
	certPEM := []byte(certStr)
	block, _ := pem.Decode(certPEM)
	if block == nil {
		return "", fmt.Errorf("无法解析证书 PEM")
	}
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "", fmt.Errorf("解析证书失败: %v", err)
	}

	sha256Hash := sha256.Sum256(cert.Raw)
	return hex.EncodeToString(sha256Hash[:]), nil
}

// PEMToPFX 将PEM格式的证书和私钥转换为PFX格式
func PEMToPFX(certPEM, keyPEM, pfxPassword string) ([]byte, error) {
	// 使用默认密码如果未提供
	if pfxPassword == "" {
		pfxPassword = "allinssl"
	}

	// 解析证书PEM
	certBlock, _ := pem.Decode([]byte(certPEM))
	if certBlock == nil || certBlock.Type != "CERTIFICATE" {
		return nil, fmt.Errorf("无效的证书PEM格式")
	}

	// 解析私钥PEM
	keyBlock, _ := pem.Decode([]byte(keyPEM))
	if keyBlock == nil || (!strings.Contains(keyBlock.Type, "PRIVATE KEY")) {
		return nil, fmt.Errorf("无效的私钥PEM格式")
	}

	// 解析X.509证书
	cert, err := x509.ParseCertificate(certBlock.Bytes)
	if err != nil {
		return nil, fmt.Errorf("解析证书失败: %v", err)
	}

	// 尝试解析私钥(PKCS8或PKCS1格式)
	var privKey interface{}
	privKey, err = x509.ParsePKCS8PrivateKey(keyBlock.Bytes)
	if err != nil {
		privKey, err = x509.ParsePKCS1PrivateKey(keyBlock.Bytes)
		if err != nil {
			return nil, fmt.Errorf("解析私钥失败: %v", err)
		}
	}

	// 编码为PFX格式
	pfxData, err := pkcs12.Encode(rand.Reader, privKey, cert, nil, pfxPassword)
	if err != nil {
		return nil, fmt.Errorf("编码PFX失败: %v", err)
	}

	return pfxData, nil
}

// PfxToJks 将PFX格式证书转换为JKS格式
func PfxToJks(pfxData []byte, pfxPassword, jksPassword, alias string) (*bytes.Buffer, error) {
	if pfxPassword == "" {
		return nil, fmt.Errorf("PFX 密码不能为空")
	}
	if jksPassword == "" {
		jksPassword = pfxPassword
	}
	if alias == "" {
		alias = "mycert"
	}
	// 解析 PFX，提取私钥、证书链
	priv, cert, caCerts, err := pkcs12.DecodeChain(pfxData, pfxPassword)
	if err != nil {
		return nil, fmt.Errorf("解析 PFX 失败: %w", err)
	}

	// 序列化私钥，兼容多种类型
	pkBytes, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		return nil, fmt.Errorf("私钥序列化失败: %w", err)
	}

	// 构建证书链
	certChain := make([]keystore.Certificate, 0, len(caCerts)+1)
	certChain = append(certChain, keystore.Certificate{
		Type:    "X.509",
		Content: cert.Raw,
	})
	for _, c := range caCerts {
		certChain = append(certChain, keystore.Certificate{
			Type:    "X.509",
			Content: c.Raw,
		})
	}

	// 创建 JKS 并写入条目
	ks := keystore.New()
	ks.SetPrivateKeyEntry(alias, keystore.PrivateKeyEntry{
		PrivateKey:       pkBytes,
		CertificateChain: certChain,
	}, []byte(jksPassword))

	// 写入到 Buffer
	var buf bytes.Buffer
	if err := ks.Store(&buf, []byte(jksPassword)); err != nil {
		return nil, fmt.Errorf("生成 JKS 失败: %w", err)
	}

	return &buf, nil
}
