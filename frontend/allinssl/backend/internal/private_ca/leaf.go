package private_ca

import (
	"crypto/x509"
	"crypto/x509/pkix"
	"errors"
	"fmt"
	"github.com/tjfoc/gmsm/sm2"
	gmx509 "github.com/tjfoc/gmsm/x509"
	"math/big"
	"time"
)

// GenerateLeafCertificate 生成叶子证书（服务器/客户端证书/邮件证书）
func GenerateLeafCertificate(commonName string, san SAN, issuer *Certificate, keyType KeyType, usage int, keyBits int, validDays int) (*LeafCertConfig, error) {
	if issuer == nil {
		return nil, errors.New("issuer is nil")
	}
	if issuer.KeyType != keyType {
		return nil, errors.New("issuer key type mismatch")
	}

	if keyType == KeySM2 {
		if issuer.SignGmCert == nil {
			return nil, errors.New("issuer must be a valid SM2 dual-certificate CA")
		}
		// 国密SM2证书 - 生成签名和加密双证书, 使用不同私钥

		// 1. 为签名和加密证书分别生成私钥
		signPriv, err := generatePrivateKey(keyType, 0)
		if err != nil {
			return nil, fmt.Errorf("failed to generate SM2 signing key: %w", err)
		}
		encryptPriv, err := generatePrivateKey(keyType, 0)
		if err != nil {
			return nil, fmt.Errorf("failed to generate SM2 encryption key: %w", err)
		}

		now := time.Now()
		expire := now.AddDate(0, 0, validDays)
		if validDays <= 0 {
			expire = now.AddDate(1, 0, 0)
		}

		// 2. 创建签名证书模板
		signTmpl := &gmx509.Certificate{
			SerialNumber:   big.NewInt(now.UnixNano()),
			Subject:        pkix.Name{CommonName: commonName},
			NotBefore:      now,
			NotAfter:       expire,
			IsCA:           false,
			KeyUsage:       gmx509.KeyUsageDigitalSignature, // 仅用于签名
			ExtKeyUsage:    []gmx509.ExtKeyUsage{gmx509.ExtKeyUsage(usage)},
			DNSNames:       san.DNSNames,
			IPAddresses:    san.IPAddresses,
			EmailAddresses: san.EmailAddresses,
		}

		// 3. 创建加密证书模板
		encryptTmpl := &gmx509.Certificate{
			SerialNumber:   big.NewInt(now.UnixNano() + 1), // 使用不同的序列号
			Subject:        pkix.Name{CommonName: commonName},
			NotBefore:      now,
			NotAfter:       expire,
			IsCA:           false,
			KeyUsage:       gmx509.KeyUsageKeyEncipherment, // 仅用于加密
			ExtKeyUsage:    []gmx509.ExtKeyUsage{gmx509.ExtKeyUsage(usage)},
			DNSNames:       san.DNSNames,
			IPAddresses:    san.IPAddresses,
			EmailAddresses: san.EmailAddresses,
		}

		// 4. 使用颁发者密钥签发签名证书
		signCert, err := signSM2Cert(signTmpl, issuer.SignGmCert, signPriv.(*sm2.PrivateKey), issuer.Key.(*sm2.PrivateKey))
		if err != nil {
			return nil, fmt.Errorf("failed to sign SM2 signing cert: %w", err)
		}

		// 5. 使用颁发者密钥签发加密证书
		encryptCert, err := signSM2Cert(encryptTmpl, issuer.EncryptGmCert, encryptPriv.(*sm2.PrivateKey), issuer.Key.(*sm2.PrivateKey))
		if err != nil {
			return nil, fmt.Errorf("failed to sign SM2 encryption cert: %w", err)
		}

		// 6. 组装返回结果
		return &LeafCertConfig{
			CN:         commonName,
			Usage:      int64(usage),
			Cert:       string(signCert.CertPEM),
			Key:        string(signCert.KeyPEM),
			EnCert:     string(encryptCert.CertPEM),
			EnKey:      string(encryptCert.KeyPEM),
			Algorithm:  "sm2",
			KeyLength:  256,
			NotAfter:   expire.Format("2006-01-02 15:04:05"),
			NotBefore:  now.Format("2006-01-02 15:04:05"),
			CreateTime: now.Format("2006-01-02 15:04:05"),
		}, nil
	}

	// 标准算法证书
	priv, err := generatePrivateKey(keyType, keyBits)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	expire := now.AddDate(0, 0, validDays)
	if validDays <= 0 {
		expire = now.AddDate(1, 0, 0)
	}

	tmpl := &x509.Certificate{
		SerialNumber: big.NewInt(now.UnixNano()),
		Subject:      pkix.Name{CommonName: commonName},
		NotBefore:    now,
		NotAfter:     expire,
		IsCA:         false,
		KeyUsage:     x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsage(usage)},
	}

	tmpl.DNSNames = san.DNSNames
	tmpl.IPAddresses = san.IPAddresses
	cert, err := signCert(tmpl, issuer.Cert, priv, issuer.Key, keyType)
	if err != nil {
		return nil, err
	}
	cert.KeyType = keyType
	return &LeafCertConfig{
		CN:         commonName,
		Usage:      int64(usage),
		Cert:       string(cert.CertPEM),
		Key:        string(cert.KeyPEM),
		Algorithm:  string(keyType),
		KeyLength:  int64(keyBits),
		NotAfter:   expire.Format("2006-01-02 15:04:05"),
		NotBefore:  now.Format("2006-01-02 15:04:05"),
		CreateTime: now.Format("2006-01-02 15:04:05"),
	}, nil
}
