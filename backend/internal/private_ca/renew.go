package private_ca

import (
	"crypto/x509"
	"crypto/x509/pkix"
	"errors"
	"fmt"
	"math/big"
	"strconv"
	"time"

	"github.com/tjfoc/gmsm/sm2"
	gmx509 "github.com/tjfoc/gmsm/x509"
)

// RenewCA 以不变更私钥的方式续期 CA 证书（兼容更新）：
// 复用原证书的主题与私钥，在现有到期时间基础上顺延有效期（已过期的从现在开始计算），
// 仅更换序列号，因此该 CA 已签发的叶子证书与现有信任链均不受影响。
func RenewCA(id, validDays int64) error {
	if id <= 0 {
		return errors.New("CA ID不能为空")
	}
	if validDays <= 0 {
		return errors.New("有效期必须大于0")
	}

	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()

	rows, err := s.Where("id=?", []interface{}{id}).Select()
	if err != nil {
		return err
	}
	if len(rows) == 0 {
		return fmt.Errorf("CA with id %d not found", id)
	}
	ca := rows[0]
	isRoot := ca["root_id"] == "" || ca["root_id"] == nil
	keyType := KeyType(dbString(ca["algorithm"]))

	// 解析原证书，复用其主题、密钥与有效期起始时间，保证续期前后兼容
	var subject pkix.Name
	var notBefore, oldNotAfter time.Time
	var own *Certificate
	if keyType == KeySM2 {
		own, err = NewCertificateFromPEMSM2([]byte(dbString(ca["cert"])), []byte(dbString(ca["key"])), []byte(dbString(ca["en_cert"])), []byte(dbString(ca["en_key"])))
		if err != nil {
			return fmt.Errorf("解析原SM2证书失败: %w", err)
		}
		subject = own.SignGmCert.Subject
		notBefore = own.SignGmCert.NotBefore
		oldNotAfter = own.SignGmCert.NotAfter
	} else {
		own, err = NewCertificateFromPEMStandard([]byte(dbString(ca["cert"])), []byte(dbString(ca["key"])), keyType)
		if err != nil {
			return fmt.Errorf("解析原证书失败: %w", err)
		}
		subject = own.Cert.Subject
		notBefore = own.Cert.NotBefore
		oldNotAfter = own.Cert.NotAfter
	}

	now := time.Now()
	// 在现有到期时间基础上增加有效期，已过期的从现在开始计算
	base := oldNotAfter
	if base.Before(now) {
		base = now
	}
	expire := base.AddDate(0, 0, int(validDays))

	// 中间CA收紧为 pathlen:0（只允许直接签发叶子证书），根CA保持 pathlen:2
	maxPathLen := 0
	if isRoot {
		maxPathLen = 2
	}

	// 中间CA需要父级CA重新签发，且有效期不能超过父级CA
	var issuer *Certificate
	if !isRoot {
		issuer, err = loadIssuer(dbString(ca["root_id"]))
		if err != nil {
			return err
		}
		if issuer.KeyType != keyType {
			return fmt.Errorf("父级CA算法与当前CA不一致: %s != %s", issuer.KeyType, keyType)
		}
		issuerNotAfter := issuer.NotAfter()
		if issuerNotAfter.IsZero() {
			return errors.New("解析父级CA过期时间失败")
		}
		if expire.After(issuerNotAfter) {
			return fmt.Errorf("续期后的有效期不能超过父级CA的有效期，父级CA将在 %s 过期，请先续期父级CA或减少增加的有效期", issuerNotAfter.Format("2006-01-02"))
		}
	}

	update := map[string]interface{}{
		"not_after": expire.Format("2006-01-02 15:04:05"),
	}

	if keyType == KeySM2 {
		// 国密SM2双证书 - 复用原签名/加密私钥重新签发
		newSign, newEncrypt, err := renewSM2CACert(subject, own.Key.(*sm2.PrivateKey), own.EncryptKey.(*sm2.PrivateKey), issuer, maxPathLen, notBefore, expire)
		if err != nil {
			return err
		}
		update["cert"] = string(newSign.CertPEM)
		update["en_cert"] = string(newEncrypt.CertPEM)
	} else {
		// 标准算法 - 复用原私钥重新签发
		newCert, err := renewStandardCACert(subject, own.Key, issuer, keyType, maxPathLen, notBefore, expire)
		if err != nil {
			return err
		}
		update["cert"] = string(newCert.CertPEM)
	}

	// 私钥、主题、起始时间均保持不变，仅更新证书与到期时间
	_, err = s.Where("id=?", []interface{}{id}).Update(update)
	return err
}

// renewStandardCACert 使用既有私钥重新签发标准算法CA证书，issuer 为 nil 时表示根CA自签
func renewStandardCACert(subject pkix.Name, priv interface{}, issuer *Certificate, keyType KeyType, maxPathLen int, notBefore, notAfter time.Time) (*Certificate, error) {
	tmpl := &x509.Certificate{
		SerialNumber:          big.NewInt(time.Now().UnixNano()),
		Subject:               subject,
		NotBefore:             notBefore,
		NotAfter:              notAfter,
		IsCA:                  true,
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageCRLSign,
		BasicConstraintsValid: true,
		MaxPathLen:            maxPathLen,
		MaxPathLenZero:        maxPathLen == 0, // 显式编码 pathlen:0
	}
	if issuer == nil {
		// 根CA自签
		return signCert(tmpl, tmpl, priv, priv, keyType)
	}
	return signCert(tmpl, issuer.Cert, priv, issuer.Key, keyType)
}

// renewSM2CACert 使用既有私钥重新签发SM2双证书，issuer 为 nil 时表示根CA自签
func renewSM2CACert(subject pkix.Name, signPriv, encryptPriv *sm2.PrivateKey, issuer *Certificate, maxPathLen int, notBefore, notAfter time.Time) (signCertOut, encryptCertOut *Certificate, err error) {
	signTmpl := &gmx509.Certificate{
		SerialNumber:          big.NewInt(time.Now().UnixNano()),
		Subject:               subject,
		NotBefore:             notBefore,
		NotAfter:              notAfter,
		IsCA:                  true,
		KeyUsage:              gmx509.KeyUsageCertSign | gmx509.KeyUsageCRLSign,
		BasicConstraintsValid: true,
		MaxPathLen:            maxPathLen,
		MaxPathLenZero:        maxPathLen == 0, // 显式编码 pathlen:0
	}
	encryptTmpl := &gmx509.Certificate{
		SerialNumber:          big.NewInt(time.Now().UnixNano() + 1),
		Subject:               subject,
		NotBefore:             notBefore,
		NotAfter:              notAfter,
		IsCA:                  true,
		KeyUsage:              gmx509.KeyUsageKeyEncipherment | gmx509.KeyUsageDataEncipherment,
		BasicConstraintsValid: true,
		MaxPathLen:            maxPathLen,
		MaxPathLenZero:        maxPathLen == 0, // 显式编码 pathlen:0
	}

	if issuer == nil {
		// 根CA：签名证书自签，加密证书由签名证书签发
		signCertOut, err = signSM2Cert(signTmpl, signTmpl, signPriv, signPriv)
		if err != nil {
			return nil, nil, fmt.Errorf("续期SM2根签名证书失败: %w", err)
		}
		encryptCertOut, err = signSM2Cert(encryptTmpl, signTmpl, encryptPriv, signPriv)
		if err != nil {
			return nil, nil, fmt.Errorf("续期SM2根加密证书失败: %w", err)
		}
		return signCertOut, encryptCertOut, nil
	}

	signCertOut, err = signSM2Cert(signTmpl, issuer.SignGmCert, signPriv, issuer.Key.(*sm2.PrivateKey))
	if err != nil {
		return nil, nil, fmt.Errorf("续期SM2中间签名证书失败: %w", err)
	}
	encryptCertOut, err = signSM2Cert(encryptTmpl, issuer.SignGmCert, encryptPriv, issuer.Key.(*sm2.PrivateKey))
	if err != nil {
		return nil, nil, fmt.Errorf("续期SM2中间加密证书失败: %w", err)
	}
	return signCertOut, encryptCertOut, nil
}

// loadIssuer 从数据库加载父级CA并构建签发者对象
func loadIssuer(rootId string) (*Certificate, error) {
	s, err := GetSqlite()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	issuers, err := s.Where("id=?", []interface{}{rootId}).Select()
	if err != nil {
		return nil, err
	}
	if len(issuers) == 0 {
		return nil, fmt.Errorf("父级CA with id %s not found", rootId)
	}
	issuer := issuers[0]
	keyType := KeyType(dbString(issuer["algorithm"]))
	if keyType == KeySM2 {
		return NewCertificateFromPEMSM2([]byte(dbString(issuer["cert"])), []byte(dbString(issuer["key"])), []byte(dbString(issuer["en_cert"])), []byte(dbString(issuer["en_key"])))
	}
	return NewCertificateFromPEMStandard([]byte(dbString(issuer["cert"])), []byte(dbString(issuer["key"])), keyType)
}

// NotAfter 返回证书的过期时间
func (c *Certificate) NotAfter() time.Time {
	if c.Cert != nil {
		return c.Cert.NotAfter
	}
	if c.SignGmCert != nil {
		return c.SignGmCert.NotAfter
	}
	return time.Time{}
}

func dbString(v interface{}) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	return fmt.Sprintf("%v", v)
}

func dbInt64(v interface{}) int64 {
	switch n := v.(type) {
	case nil:
		return 0
	case int64:
		return n
	case int:
		return int64(n)
	case float64:
		return int64(n)
	case string:
		i, _ := strconv.ParseInt(n, 10, 64)
		return i
	}
	return 0
}
