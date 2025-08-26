package private_ca

import (
	"ALLinSSL/backend/public"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/tjfoc/gmsm/sm2"
	gmx509 "github.com/tjfoc/gmsm/x509"
)

func GetSqlite() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/private_ca.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "ca"
	return s, nil
}

// ----------- 标准算法 Root CA -----------
func GenerateRootCAStandard(name, commonName, organization, organizationalUnit, country, province, locality string, keyType KeyType, keyBits, validDays int) (*CAConfig, error) {
	if keyType == KeySM2 {
		return nil, errors.New("use GenerateRootCASM2 for SM2")
	}

	priv, err := generatePrivateKey(keyType, keyBits)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	expire := now.AddDate(0, 0, validDays)
	if validDays <= 0 {
		expire = now.AddDate(10, 0, 0)
	}

	tmpl := &x509.Certificate{
		SerialNumber: big.NewInt(now.UnixNano()),
		Subject: pkix.Name{
			// 通用名称
			CommonName: commonName,
			// 组织名称
			Organization: []string{organization},
			// 组织单位名称
			OrganizationalUnit: []string{organizationalUnit},
			// 国家代码
			Country: []string{country},
			// 省份名称
			Province: []string{province},
			// 城市名称
			Locality: []string{locality},
		},
		NotBefore:             now,
		NotAfter:              expire,
		IsCA:                  true,
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageCRLSign,
		BasicConstraintsValid: true,
		MaxPathLen:            2,
	}

	cert, err := signCert(tmpl, tmpl, priv, priv, keyType)
	if err != nil {
		return nil, err
	}

	cert.KeyType = keyType
	return &CAConfig{
		Name:       name,
		CN:         commonName,
		O:          organization,
		C:          country,
		Cert:       string(cert.CertPEM),
		Key:        string(cert.KeyPEM),
		Algorithm:  string(keyType),
		KeyLength:  int64(keyBits),
		NotBefore:  now.Format("2006-01-02 15:04:05"),
		NotAfter:   expire.Format("2006-01-02 15:04:05"),
		CreateTime: now.Format("2006-01-02 15:04:05"),
	}, nil
}

// ----------- SM2 Root CA (双证书体系) -----------
func GenerateRootCASM2(name, commonName, organization, organizationalUnit, country, province, locality string, validDays int) (*CAConfig, error) {
	// 1. 为签名和加密功能分别生成私钥
	signPriv, err := generatePrivateKey(KeySM2, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to generate SM2 root signing key: %w", err)
	}
	encryptPriv, err := generatePrivateKey(KeySM2, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to generate SM2 root encryption key: %w", err)
	}

	now := time.Now()
	expire := now.AddDate(0, 0, validDays)
	if validDays <= 0 {
		expire = now.AddDate(10, 0, 0)
	}

	// 2. 创建根签名证书模板
	signTmpl := &gmx509.Certificate{
		SerialNumber: big.NewInt(now.UnixNano()),
		Subject: pkix.Name{
			// 通用名称
			CommonName: commonName,
			// 组织名称
			Organization: []string{organization},
			// 组织单位名称
			OrganizationalUnit: []string{organizationalUnit},
			// 国家代码
			Country: []string{country},
			// 省份名称
			Province: []string{province},
			// 城市名称
			Locality: []string{locality},
		},
		NotBefore:             now,
		NotAfter:              expire,
		IsCA:                  true,
		KeyUsage:              gmx509.KeyUsageCertSign | gmx509.KeyUsageCRLSign,
		BasicConstraintsValid: true,
		MaxPathLen:            2,
	}

	// 3. 创建根加密证书模板
	encryptTmpl := &gmx509.Certificate{
		SerialNumber: big.NewInt(now.UnixNano() + 1),
		Subject: pkix.Name{
			// 通用名称
			CommonName: commonName,
			// 组织名称
			Organization: []string{organization},
			// 组织单位名称
			OrganizationalUnit: []string{organizationalUnit},
			// 国家代码
			Country: []string{country},
			// 省份名称
			Province: []string{province},
			// 城市名称
			Locality: []string{locality},
		},
		NotBefore:             now,
		NotAfter:              expire,
		IsCA:                  true,
		KeyUsage:              gmx509.KeyUsageKeyEncipherment | gmx509.KeyUsageDataEncipherment,
		BasicConstraintsValid: true,
		MaxPathLen:            2,
	}

	// 4. 自签名根签名证书 (使用自己的签名私钥)
	signCert, err := signSM2Cert(signTmpl, signTmpl, signPriv.(*sm2.PrivateKey), signPriv.(*sm2.PrivateKey))
	if err != nil {
		return nil, fmt.Errorf("failed to self-sign SM2 root signing cert: %w", err)
	}

	// 5. 使用根签名证书签发根加密证书
	encryptCert, err := signSM2Cert(encryptTmpl, signTmpl, encryptPriv.(*sm2.PrivateKey), signPriv.(*sm2.PrivateKey))
	if err != nil {
		return nil, fmt.Errorf("failed to sign SM2 root encryption cert: %w", err)
	}

	// 6. 组装返回结果
	return &CAConfig{
		Name:       name,
		CN:         commonName,
		O:          organization,
		C:          country,
		Cert:       string(signCert.CertPEM),
		Key:        string(signCert.KeyPEM),
		EnCert:     string(encryptCert.CertPEM),
		EnKey:      string(encryptCert.KeyPEM),
		Algorithm:  "sm2",
		KeyLength:  256,
		NotBefore:  now.Format("2006-01-02 15:04:05"),
		NotAfter:   expire.Format("2006-01-02 15:04:05"),
		CreateTime: now.Format("2006-01-02 15:04:05"),
	}, nil
}

// ----------- 标准算法 Intermediate CA -----------
func GenerateIntermediateCAStandard(name, commonName, organization, organizationalUnit, country, province, locality, cert, key, algorithm string, keyBits, validDays int) (*CAConfig, error) {

	keyType := KeyType(algorithm)
	issuer, err := NewCertificateFromPEMStandard([]byte(cert), []byte(key), keyType)
	if err != nil {
		return nil, fmt.Errorf("failed to parse issuer certificate: %w", err)
	}

	if issuer == nil {
		return nil, errors.New("issuer is nil")
	}
	if issuer.KeyType != keyType {
		return nil, fmt.Errorf("issuer and intermediate key type mismatch: %s != %s", issuer.KeyType, keyType)
	}
	if keyType == KeySM2 {
		return nil, errors.New("use GenerateIntermediateCASM2 for SM2")
	}

	priv, err := generatePrivateKey(keyType, keyBits)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	expire := now.AddDate(0, 0, validDays)
	if validDays <= 0 {
		expire = now.AddDate(5, 0, 0)
	}

	tmpl := &x509.Certificate{
		SerialNumber: big.NewInt(now.UnixNano()),
		Subject: pkix.Name{
			// 通用名称
			CommonName: commonName,
			// 组织名称
			Organization: []string{organization},
			// 组织单位名称
			OrganizationalUnit: []string{organizationalUnit},
			// 国家代码
			Country: []string{country},
			// 省份名称
			Province: []string{province},
			// 城市名称
			Locality: []string{locality},
		},
		NotBefore:             now,
		NotAfter:              expire,
		IsCA:                  true,
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageCRLSign,
		BasicConstraintsValid: true,
		MaxPathLen:            1,
	}

	certObj, err := signCert(tmpl, issuer.Cert, priv, issuer.Key, keyType)
	if err != nil {
		return nil, err
	}

	certObj.KeyType = keyType
	return &CAConfig{
		Name:       name,
		CN:         commonName,
		O:          organization,
		C:          country,
		Cert:       string(certObj.CertPEM),
		Key:        string(certObj.KeyPEM),
		Algorithm:  string(keyType),
		KeyLength:  int64(keyBits),
		NotBefore:  now.Format("2006-01-02 15:04:05"),
		NotAfter:   expire.Format("2006-01-02 15:04:05"),
		CreateTime: now.Format("2006-01-02 15:04:05"),
	}, nil
}

// ----------- SM2 Intermediate CA (双证书体系) -----------
func GenerateIntermediateCASM2(name, commonName, organization, organizationalUnit, country, province, locality, cert, key, enCert, enKey string, validDays int) (*CAConfig, error) {

	issuer, err := NewCertificateFromPEMSM2([]byte(cert), []byte(key), []byte(enCert), []byte(enKey))
	if err != nil {
		return nil, fmt.Errorf("failed to parse issuer certificate: %w", err)
	}
	if issuer == nil {
		return nil, errors.New("issuer is nil")
	}
	if issuer.KeyType != KeySM2 || issuer.SignGmCert == nil {
		return nil, errors.New("issuer must be a valid SM2 dual-certificate CA")
	}

	// 1. 为签名和加密功能分别生成私钥
	signPriv, err := generatePrivateKey(KeySM2, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to generate SM2 intermediate signing key: %w", err)
	}
	encryptPriv, err := generatePrivateKey(KeySM2, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to generate SM2 intermediate encryption key: %w", err)
	}

	now := time.Now()
	expire := now.AddDate(0, 0, validDays)
	if validDays <= 0 {
		expire = now.AddDate(5, 0, 0)
	}

	// 2. 创建中间签名证书模板
	signTmpl := &gmx509.Certificate{
		SerialNumber: big.NewInt(now.UnixNano()),
		Subject: pkix.Name{
			// 通用名称
			CommonName: commonName,
			// 组织名称
			Organization: []string{organization},
			// 组织单位名称
			OrganizationalUnit: []string{organizationalUnit},
			// 国家代码
			Country: []string{country},
			// 省份名称
			Province: []string{province},
			// 城市名称
			Locality: []string{locality},
		},
		NotBefore:             now,
		NotAfter:              expire,
		IsCA:                  true,
		KeyUsage:              gmx509.KeyUsageCertSign | gmx509.KeyUsageCRLSign,
		BasicConstraintsValid: true,
		MaxPathLen:            1,
	}

	// 3. 创建中间加密证书模板
	encryptTmpl := &gmx509.Certificate{
		SerialNumber: big.NewInt(now.UnixNano() + 1),
		Subject: pkix.Name{
			// 通用名称
			CommonName: commonName,
			// 组织名称
			Organization: []string{organization},
			// 组织单位名称
			OrganizationalUnit: []string{organizationalUnit},
			// 国家代码
			Country: []string{country},
			// 省份名称
			Province: []string{province},
			// 城市名称
			Locality: []string{locality},
		},
		NotBefore:             now,
		NotAfter:              expire,
		IsCA:                  true,
		KeyUsage:              gmx509.KeyUsageKeyEncipherment | gmx509.KeyUsageDataEncipherment,
		BasicConstraintsValid: true,
		MaxPathLen:            1,
	}

	// 4. 使用颁发者的签名证书和私钥，签发中间签名证书
	signCert, err := signSM2Cert(signTmpl, issuer.SignGmCert, signPriv.(*sm2.PrivateKey), issuer.Key.(*sm2.PrivateKey))
	if err != nil {
		return nil, fmt.Errorf("failed to sign SM2 intermediate signing cert: %w", err)
	}

	// 5. 使用颁发者的签名证书和私钥，签发中间加密证书
	encryptCert, err := signSM2Cert(encryptTmpl, issuer.SignGmCert, encryptPriv.(*sm2.PrivateKey), issuer.Key.(*sm2.PrivateKey))
	if err != nil {
		return nil, fmt.Errorf("failed to sign SM2 intermediate encryption cert: %w", err)
	}

	// 6. 组装返回结果
	return &CAConfig{
		Name:       name,
		CN:         commonName,
		O:          organization,
		C:          country,
		Cert:       string(signCert.CertPEM),
		Key:        string(signCert.KeyPEM),
		EnCert:     string(encryptCert.CertPEM),
		EnKey:      string(encryptCert.KeyPEM),
		Algorithm:  "sm2",
		KeyLength:  256,
		NotBefore:  now.Format("2006-01-02 15:04:05"),
		NotAfter:   expire.Format("2006-01-02 15:04:05"),
		CreateTime: now.Format("2006-01-02 15:04:05"),
	}, nil
}

// NewCertificateFromPEMStandard 从PEM格式的标准算法证书和私钥创建Certificate对象
func NewCertificateFromPEMStandard(certPEM, keyPEM []byte, keyType KeyType) (*Certificate, error) {
	if keyType == KeySM2 {
		return nil, errors.New("use NewCertificateFromPEMSM2 for SM2 certificates")
	}

	certBlock, _ := pem.Decode(certPEM)
	if certBlock == nil || certBlock.Type != "CERTIFICATE" {
		return nil, errors.New("failed to decode certificate PEM")
	}

	keyBlock, _ := pem.Decode(keyPEM)
	if keyBlock == nil {
		return nil, errors.New("failed to decode key PEM")
	}

	cert := &Certificate{
		CertPEM: certPEM,
		KeyPEM:  keyPEM,
		KeyType: keyType,
	}

	var err error
	cert.Cert, err = x509.ParseCertificate(certBlock.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse standard certificate: %w", err)
	}

	switch keyType {
	case KeyRSA:
		cert.Key, err = x509.ParsePKCS1PrivateKey(keyBlock.Bytes)
		if err != nil {
			pkcs8Key, err2 := x509.ParsePKCS8PrivateKey(keyBlock.Bytes)
			if err2 != nil {
				return nil, fmt.Errorf("failed to parse rsa private key (PKCS1 and PKCS8): %w", err)
			}
			cert.Key = pkcs8Key
			err = nil
		}
	case KeyECDSA:
		cert.Key, err = x509.ParseECPrivateKey(keyBlock.Bytes)
		if err != nil {
			pkcs8Key, err2 := x509.ParsePKCS8PrivateKey(keyBlock.Bytes)
			if err2 != nil {
				return nil, fmt.Errorf("failed to parse ecdsa private key (EC and PKCS8): %w", err)
			}
			cert.Key = pkcs8Key
			err = nil
		}
	default:
		return nil, fmt.Errorf("unsupported key type: %s", keyType)
	}

	return cert, nil
}

// NewCertificateFromPEMSM2 从PEM格式的国密双证书和双私钥创建Certificate对象
func NewCertificateFromPEMSM2(signCertPEM, signKeyPEM, encryptCertPEM, encryptKeyPEM []byte) (*Certificate, error) {
	// 解析签名证书
	signCertBlock, _ := pem.Decode(signCertPEM)
	if signCertBlock == nil || signCertBlock.Type != "CERTIFICATE" {
		return nil, errors.New("failed to decode signing certificate PEM")
	}
	signGmCert, err := gmx509.ParseCertificate(signCertBlock.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse sm2 signing certificate: %w", err)
	}

	// 解析签名私钥
	signKeyBlock, _ := pem.Decode(signKeyPEM)
	if signKeyBlock == nil {
		return nil, errors.New("failed to decode signing key PEM")
	}
	signKey, err := gmx509.ParsePKCS8PrivateKey(signKeyBlock.Bytes, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to parse sm2 signing private key: %w", err)
	}

	// 解析加密证书
	encryptCertBlock, _ := pem.Decode(encryptCertPEM)
	if encryptCertBlock == nil || encryptCertBlock.Type != "CERTIFICATE" {
		return nil, errors.New("failed to decode encryption certificate PEM")
	}
	encryptGmCert, err := gmx509.ParseCertificate(encryptCertBlock.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse sm2 encryption certificate: %w", err)
	}

	// 解析加密私钥
	encryptKeyBlock, _ := pem.Decode(encryptKeyPEM)
	if encryptKeyBlock == nil {
		return nil, errors.New("failed to decode encryption key PEM")
	}
	encryptKey, err := gmx509.ParsePKCS8PrivateKey(encryptKeyBlock.Bytes, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to parse sm2 encryption private key: %w", err)
	}

	return &Certificate{
		SignCertPEM:    signCertPEM,
		SignKeyPEM:     signKeyPEM,
		EncryptCertPEM: encryptCertPEM,
		EncryptKeyPEM:  encryptKeyPEM,
		Key:            signKey,
		EncryptKey:     encryptKey,
		SignGmCert:     signGmCert,
		EncryptGmCert:  encryptGmCert,
		KeyType:        KeySM2,
	}, nil
}
