package private_ca

import (
	"crypto/tls"
	"crypto/x509"
	gmx509 "github.com/tjfoc/gmsm/x509"
	"net"
)

type KeyType string

const (
	KeySM2   KeyType = "sm2"
	KeyECDSA KeyType = "ecdsa"
	KeyRSA   KeyType = "rsa"
)

type Certificate struct {
	// 对于标准算法，使用这两个字段
	CertPEM []byte `json:"cert_pem,omitempty"`
	KeyPEM  []byte `json:"key_pem,omitempty"`

	// 对于国密双证书，使用这些字段
	SignCertPEM    []byte `json:"sign_cert_pem,omitempty"`
	SignKeyPEM     []byte `json:"sign_key_pem,omitempty"`
	EncryptCertPEM []byte `json:"encrypt_cert_pem,omitempty"`
	EncryptKeyPEM  []byte `json:"encrypt_key_pem,omitempty"`

	// --- 以下为内部使用字段 ---
	TLSCert *tls.Certificate `json:"-"`

	// 标准算法证书对象
	Cert *x509.Certificate `json:"-"`

	// 国密证书对象
	SignGmCert    *gmx509.Certificate `json:"-"`
	EncryptGmCert *gmx509.Certificate `json:"-"`

	// 私钥对象
	Key        interface{} `json:"-"` // 标准算法私钥 或 国密签名私钥
	EncryptKey interface{} `json:"-"` // 国密加密私钥

	KeyType KeyType `json:"-"`
}

type SAN struct {
	DNSNames       []string `json:"dns_names"`
	IPAddresses    []net.IP `json:"ip_addresses"`
	EmailAddresses []string `json:"email_addresses"`
}

type CAConfig struct {
	Id         int64  `json:"id" form:"id"`
	RootId     int64  `json:"root_id" form:"root_id"`
	Name       string `json:"name" form:"name"`
	CN         string `json:"cn" form:"cn"`
	O          string `json:"o" form:"o"`
	C          string `json:"c" form:"c"`
	OU         string `json:"ou" form:"ou"`
	Province   string `json:"province" form:"province"`
	Locality   string `json:"locality" form:"locality"`
	Cert       string `json:"cert" form:"cert"`
	Key        string `json:"key" form:"key"`
	EnCert     string `json:"en_cert" form:"en_cert"`
	EnKey      string `json:"en_key" form:"en_key"`
	Algorithm  string `json:"algorithm" form:"algorithm"`
	KeyLength  int64  `json:"key_length" form:"key_length"`
	NotAfter   string `json:"not_after" form:"not_after"`
	NotBefore  string `json:"not_before" form:"not_before"`
	CreateTime string `json:"create_time" form:"create_time"`
	ValidDays  int64  `json:"valid_days" form:"valid_days"`
}

type LeafCertConfig struct {
	Id         int64  `json:"id" form:"id"`
	CaId       int64  `json:"ca_id" form:"ca_id"`
	CN         string `json:"cn" form:"cn"`
	SAN        string `json:"san" form:"san"`
	Usage      int64  `json:"usage" form:"usage"`
	Cert       string `json:"cert" form:"cert"`
	Key        string `json:"key" form:"key"`
	IssuerCert string `json:"-" form:"-"`
	EnCert     string `json:"en_cert" form:"en_cert"`
	EnKey      string `json:"en_key" form:"en_key"`
	Algorithm  string `json:"algorithm" form:"algorithm"`
	KeyLength  int64  `json:"key_length" form:"key_length"`
	NotAfter   string `json:"not_after" form:"not_after"`
	NotBefore  string `json:"not_before" form:"not_before"`
	ValidDays  int64  `json:"valid_days" form:"valid_days"`
	CreateTime string `json:"create_time" form:"create_time"`
}
