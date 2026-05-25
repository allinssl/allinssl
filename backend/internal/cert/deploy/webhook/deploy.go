package webhook

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/public"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"strconv"
)

func Deploy(cfg map[string]any) error {
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	var providerID string
	switch v := cfg["provider_id"].(type) {
	case float64:
		providerID = strconv.Itoa(int(v))
	case string:
		providerID = v
	default:
		return fmt.Errorf("参数错误：provider_id")
	}
	//
	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return err
	}
	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return fmt.Errorf("api配置错误")
	}
	// 解析 JSON 配置
	var providerConfigMap map[string]interface{}

	err = json.Unmarshal([]byte(providerConfigStr), &providerConfigMap)
	if err != nil {
		return err
	}

	var ignoreSSL bool
	switch v := providerConfigMap["ignore_ssl"].(type) {
	case string:
		if v == "1" {
			ignoreSSL = true
		}
	case float64:
		if v != 0 {
			ignoreSSL = true
		}
	case bool:
		ignoreSSL = v
	}

	providerConfig := public.WebhookConfig{
		Url:       providerConfigMap["url"].(string),
		Data:      providerConfigMap["data"].(string),
		Method:    providerConfigMap["method"].(string),
		Headers:   providerConfigMap["headers"].(string),
		IgnoreSSL: ignoreSSL,
	}

	certStr, ok := cert["cert"].(string)
	if !ok || certStr == "" {
		return fmt.Errorf("cert is required and must be a string")
	}
	keyStr, ok := cert["key"].(string)
	if !ok || keyStr == "" {
		return fmt.Errorf("key is required and must be a string")
	}
	domain, _ := cfg["domain"].(string)
	if domain == "" {
		block, _ := pem.Decode([]byte(certStr))
		if block != nil && block.Type == "CERTIFICATE" {
			if certObj, err := x509.ParseCertificate(block.Bytes); err == nil {
				domain = certObj.Subject.CommonName
			}
		}
	}

	data, err := public.ReplaceJSONPlaceholders(providerConfig.Data, map[string]interface{}{"key": keyStr, "cert": certStr, "domain": domain})
	if err != nil {
		return fmt.Errorf("替换JSON占位符失败: %w", err)
	}
	providerConfig.Data = data

	return providerConfig.Send()
}
