package private_ca

import (
	"ALLinSSL/backend/public"
	"crypto/x509"
	"encoding/pem"
	"encoding/json"
	"fmt"
	"time"
)

// CreateLeafCertWithPass：与原 CreateLeafCert 类似，但增加 keyPass 参数，用于解密可能受口令保护的 CA 私钥 PEM。
func CreateLeafCertWithPass(caId, usage, keyBits, validDays int64, cn, san, keyPass string) (*LeafCertConfig, error) {
	if caId <= 0 {
		return nil, fmt.Errorf("CA ID不能为空")
	}
	if san == "" {
		return nil, fmt.Errorf("备用名称不能为空")
	}
	var sans SAN
	err := json.Unmarshal([]byte(san), &sans)
	if err != nil {
		return nil, fmt.Errorf("备用名称格式错误: %v", err)
	}
	if cn == "" {
		if len(sans.DNSNames) > 0 {
			cn = sans.DNSNames[0]
		} else if len(sans.IPAddresses) > 0 {
			cn = string(sans.IPAddresses[0])
		} else if len(sans.EmailAddresses) > 0 {
			cn = sans.EmailAddresses[0]
		} else {
			return nil, fmt.Errorf("CN和SAN不能为空")
		}
	}
	s, err := GetSqlite()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	issuers, err := s.Where("id=?", []interface{}{caId}).Select()
	if err != nil {
		return nil, err
	}
	if len(issuers) == 0 {
		return nil, fmt.Errorf("issuer with id %d not found", caId)
	}
	issuer := issuers[0]
	if issuer["root_id"] == "" || issuer["root_id"] == nil {
		return nil, fmt.Errorf("不允许使用根证书直接签发叶子证书，请先创建中间证书")
	}

	keyType := issuer["algorithm"].(string)
	cert := issuer["cert"].(string)
	key := issuer["key"].(string)
	var issuerObj *Certificate
	if keyType == "sm2" {
		enCert := issuer["en_cert"].(string)
		enKey := issuer["en_key"].(string)
		// SM2 分情况处理：如果存储的是加密 blob（encrypted_key）则后续需支持
		issuerObj, err = NewCertificateFromPEMSM2([]byte(cert), []byte(key), []byte(enCert), []byte(enKey))
	} else {
		// 尝试解析 key：如果是加密 PEM，使用 keyPass 解密
		block, _ := pem.Decode([]byte(key))
		if block != nil && x509.IsEncryptedPEMBlock(block) {
			if keyPass == "" {
				return nil, fmt.Errorf("私钥受口令保护，请提供 key_pass")
			}
			privDER, derr := x509.DecryptPEMBlock(block, []byte(keyPass))
			if derr != nil {
				return nil, fmt.Errorf("解密私钥失败: %v", derr)
			}
			// 重新封装成未加密 PEM 交给现有函数解析
			plainPem := pem.EncodeToMemory(&pem.Block{Type: block.Type, Bytes: privDER})
			issuerObj, err = NewCertificateFromPEMStandard([]byte(cert), plainPem, KeyType(keyType))
		} else {
			issuerObj, err = NewCertificateFromPEMStandard([]byte(cert), []byte(key), KeyType(keyType))
		}
	}
	if err != nil {
		return nil, err
	}
	leafObj, err := GenerateLeafCertificate(cn, sans, issuerObj, KeyType(keyType), int(usage), int(keyBits), int(validDays))
	if err != nil {
		return nil, err
	}
	s.TableName = "leaf"
	// 保存到数据库
	leafObj.SAN = san
	leafObj.CaId = caId
	insertData := public.StructToMap(leafObj, true)
	_, err = s.Insert(insertData)
	if err != nil {
		return nil, err
	}
	return leafObj, nil
}