package webhook

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/public"
	"encoding/json"
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
	var providerConfig public.WebhookConfig
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return err
	}

	certStr, ok := cert["cert"].(string)
	if !ok || certStr == "" {
		return fmt.Errorf("cert is required and must be a string")
	}
	keyStr, ok := cert["key"].(string)
	if !ok || keyStr == "" {
		return fmt.Errorf("key is required and must be a string")
	}

	data, err := public.ReplaceJSONPlaceholders(providerConfig.Data, map[string]interface{}{"key": keyStr, "cert": certStr})
	if err != nil {
		return fmt.Errorf("替换JSON占位符失败: %w", err)
	}
	providerConfig.Data = data

	return providerConfig.Send()
}
