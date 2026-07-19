package deploy

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/internal/customapi"
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
)

// DeployCustomApi 通过自定义HTTP(S)接口部署证书：
// 执行提供方配置的多步请求，证书/私钥以 {{cert}}、{{key}}、{{issuer_cert}} 变量注入。
func DeployCustomApi(cfg map[string]any, logger *public.Logger) error {
	certificate, ok := cfg["certificate"].(map[string]any)
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
	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return err
	}
	configStr, _ := providerData["config"].(string)
	var config customapi.Config
	if err := json.Unmarshal([]byte(configStr), &config); err != nil {
		return fmt.Errorf("解析自定义API配置失败: %w", err)
	}

	certStr, _ := certificate["cert"].(string)
	keyStr, _ := certificate["key"].(string)
	issuerCertStr, _ := certificate["issuerCert"].(string)
	if certStr == "" || keyStr == "" {
		return fmt.Errorf("证书或私钥为空")
	}

	vars := map[string]string{
		"cert":        certStr,
		"key":         keyStr,
		"issuer_cert": issuerCertStr,
	}
	// 域名：优先取节点显式配置，否则从证书 SAN 解析
	domains, domain := customapi.DomainsFromCertPEM(certStr)
	if v, ok := cfg["domains"].(string); ok && v != "" {
		domains = v
		if parts := strings.Split(v, ","); len(parts) > 0 && parts[0] != "" {
			domain = strings.TrimSpace(parts[0])
		}
	}
	vars["domains"] = domains
	vars["domain"] = domain

	_, err = customapi.Execute(&config, vars, logger)
	return err
}
