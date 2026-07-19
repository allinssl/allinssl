package apply

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/internal/cert"
	"ALLinSSL/backend/internal/customapi"
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

// applyCustomApi 通过自定义API申请证书：
// 执行提供方配置的多步请求，从最终变量上下文中提取 cert/key/issuer_cert 作为证书输出。
func applyCustomApi(cfg map[string]any, logger *public.Logger) (map[string]any, error) {
	domains, ok := cfg["domains"].(string)
	if !ok || strings.TrimSpace(domains) == "" {
		return nil, fmt.Errorf("参数错误：domains")
	}
	email, _ := cfg["email"].(string)
	algorithm, _ := cfg["algorithm"].(string)
	if algorithm == "" {
		algorithm = "RSA2048"
	}
	endDay := 30
	switch v := cfg["end_day"].(type) {
	case float64:
		endDay = int(v)
	case int:
		endDay = v
	case string:
		if v != "" {
			n, err := strconv.Atoi(v)
			if err != nil {
				return nil, fmt.Errorf("参数错误：end_day")
			}
			endDay = n
		}
	case int64:
		endDay = int(v)
	}
	var providerID string
	switch v := cfg["provider_id"].(type) {
	case float64:
		providerID = strconv.Itoa(int(v))
	case string:
		providerID = v
	}
	if providerID == "" {
		return nil, fmt.Errorf("参数错误：provider_id")
	}
	runId, ok := cfg["_runId"].(string)
	if !ok {
		return nil, fmt.Errorf("参数错误：_runId")
	}

	domainArr := strings.Split(domains, ",")
	for i := range domainArr {
		domainArr[i] = strings.TrimSpace(domainArr[i])
	}

	// 获取上次申请的证书（复用逻辑与 ACME 一致：ARI 重构后的新写法）
	matched, err := FindMatchedCert(runId, domainArr)
	if err != nil {
		logger.Debug("未获取到符合条件的本地证书:" + err.Error())
	} else if fallbackLocalRenewalDecision(matched, endDay, logger) {
		return certResult(matched.Data), nil
	}

	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return nil, err
	}
	configStr, _ := providerData["config"].(string)
	var config customapi.Config
	if err := json.Unmarshal([]byte(configStr), &config); err != nil {
		return nil, fmt.Errorf("解析自定义API配置失败: %w", err)
	}

	logger.Debug("正在通过自定义API申请证书，域名: " + domains)
	vars, err := customapi.Execute(&config, map[string]string{
		"domains":   domains,
		"domain":    domainArr[0],
		"email":     email,
		"algorithm": algorithm,
	}, logger)
	if err != nil {
		return nil, err
	}

	certStr := findCtxVar(vars, "cert")
	keyStr := findCtxVar(vars, "key")
	issuerCertStr := findCtxVar(vars, "issuer_cert")
	if certStr == "" || keyStr == "" {
		return nil, fmt.Errorf("自定义API未输出证书：请在请求步骤中提取名为 cert、key 的响应变量（可选 issuer_cert）")
	}
	if !strings.Contains(certStr, "BEGIN CERTIFICATE") {
		return nil, fmt.Errorf("自定义API输出的 cert 不是有效的 PEM 证书")
	}
	if !strings.Contains(keyStr, "PRIVATE KEY") {
		return nil, fmt.Errorf("自定义API输出的 key 不是有效的 PEM 私钥")
	}

	_, err = cert.SaveCert("workflow", keyStr, certStr, issuerCertStr, runId)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"cert":       certStr,
		"key":        keyStr,
		"issuerCert": issuerCertStr,
	}, nil
}

// findCtxVar 从最终变量上下文取输出：精确键（自定义变量）→ step.xxx 简写（最后一步提取值）→ *.xxx 后缀
func findCtxVar(vars map[string]string, name string) string {
	if v := vars[name]; v != "" {
		return v
	}
	if v := vars["step."+name]; v != "" {
		return v
	}
	suffix := "." + name
	keys := make([]string, 0, len(vars))
	for k := range vars {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		if strings.HasSuffix(k, suffix) && vars[k] != "" {
			return vars[k]
		}
	}
	return ""
}
