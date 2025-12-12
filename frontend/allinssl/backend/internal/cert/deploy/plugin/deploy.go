package plugin

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
	"strconv"
)

type CertDeployPlugin struct {
	Config map[string]any
	Key    string
	Cert   string
}

func Deploy(cfg map[string]any, logger *public.Logger) error {
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	action, ok := cfg["action"].(string)
	if !ok {
		return fmt.Errorf("操作类型错误：action")
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
	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return fmt.Errorf("api配置错误")
	}
	var providerConfig map[string]any
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return fmt.Errorf("api配置解析错误：%v", err)
	}
	pluginName, ok := providerConfig["name"].(string)
	if !ok {
		return fmt.Errorf("插件名称错误")
	}
	var pluginConfig map[string]any
	switch v := providerConfig["config"].(type) {
	case map[string]any:
		pluginConfig = v
	case string:
		err = json.Unmarshal([]byte(v), &pluginConfig)
		if err != nil {
			fmt.Println(v)
			return fmt.Errorf("插件配置解析错误：%v", err)
		}
	default:
		fmt.Println(v)
		return fmt.Errorf("插件配置格式错误")
	}
	pluginParams, ok := cfg["params"].(string)
	if !ok {
		return fmt.Errorf("插件参数错误：params")
	}
	var paramsMap map[string]any
	err = json.Unmarshal([]byte(pluginParams), &paramsMap)
	if err != nil {
		return fmt.Errorf("插件参数解析错误：%v", err)
	}
	// 合并插件配置和参数
	for k, v := range paramsMap {
		pluginConfig[k] = v
	}

	// 设置证书
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
	}

	pluginConfig["key"] = keyPem
	pluginConfig["cert"] = certPem

	// 调用插件
	logger.Debug(fmt.Sprintf("调用插件%s:%s", pluginName, action))

	_, err = CallPlugin(pluginName, action, pluginConfig, logger)
	if err != nil {
		return fmt.Errorf("调用插件失败：%v", err)
	}
	//fmt.Println(rep)
	return err
}
