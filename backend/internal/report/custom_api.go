package report

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/internal/customapi"
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
)

// notifyCustomApiConfig 通知渠道配置：内联步骤配置 + 可选引用授权API（自定义HTTP(S)）
type notifyCustomApiConfig struct {
	customapi.Config
	Source   string `json:"source"`    // inline（默认）| access
	AccessID string `json:"access_id"` // source=access 时引用的 access 表记录 ID
}

// NotifyCustomApi 自定义API通知：引擎已抽至 customapi 包，此处只组装通知场景变量
func NotifyCustomApi(params map[string]any) error {
	if params == nil {
		return fmt.Errorf("缺少参数")
	}
	providerID, _ := params["provider_id"].(string)
	if providerID == "" {
		return fmt.Errorf("缺少 provider_id")
	}

	var logger *public.Logger
	if params["logger"] != nil {
		logger = params["logger"].(*public.Logger)
	}

	providerData, err := GetReport(providerID)
	if err != nil {
		return err
	}
	configStr, _ := providerData["config"].(string)
	var config notifyCustomApiConfig
	if err := json.Unmarshal([]byte(configStr), &config); err != nil {
		return fmt.Errorf("解析自定义API配置失败: %w", err)
	}

	execCfg := &config.Config
	// 引用授权API：从 access 表取提供方配置
	if config.Source == "access" {
		if config.AccessID == "" {
			return fmt.Errorf("缺少引用的授权API")
		}
		accessData, err := access.GetAccess(config.AccessID)
		if err != nil {
			return err
		}
		accessConfigStr, _ := accessData["config"].(string)
		var accessConfig customapi.Config
		if err := json.Unmarshal([]byte(accessConfigStr), &accessConfig); err != nil {
			return fmt.Errorf("解析授权API配置失败: %w", err)
		}
		execCfg = &accessConfig
	}

	vars := map[string]string{}
	subject, _ := params["subject"].(string)
	body, _ := params["body"].(string)
	vars["subject"] = subject
	vars["body"] = body
	// env.xxx 变量：优先从 params["env"] map 读取，否则 env.templateContent 回退到 body
	if envMap, ok := params["env"].(map[string]any); ok {
		for k, v := range envMap {
			vars["env."+k] = fmt.Sprintf("%v", v)
		}
	}
	if _, ok := vars["env.templateContent"]; !ok {
		vars["env.templateContent"] = body
	}
	// 通知对象：上游节点的证书，解析 SAN 注入域名变量
	if certMap, ok := params["certificate"].(map[string]any); ok {
		if certPEM, _ := certMap["cert"].(string); certPEM != "" {
			if domains, domain := customapi.DomainsFromCertPEM(certPEM); domains != "" {
				vars["domains"] = domains
				vars["domain"] = domain
			}
		}
	}

	_, err = customapi.Execute(execCfg, vars, logger)
	return err
}
