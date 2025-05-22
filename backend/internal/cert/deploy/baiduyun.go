package deploy

import (
	"ALLinSSL/backend/internal/access"
	baiduyuncdn "ALLinSSL/backend/internal/cert/deploy/client/baiduyun"
	"encoding/json"
	"fmt"
	"strconv"
	"time"
)

func DeployBaiduCdn(cfg map[string]any) error {
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
	var providerConfig map[string]string
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return err
	}
	
	client, err := baiduyuncdn.ClientBaiduCdn(providerConfig["access_key"], providerConfig["secret_key"])
	if err != nil {
		return err
	}
	domain, ok := cfg["domain"].(string)
	if !ok {
		return fmt.Errorf("参数错误：domain")
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
	
	certName := fmt.Sprintf("%s_allinssl_%d", domain, time.Now().UnixMilli())
	_, err = client.IPutCert(domain, certName, certPem, keyPem)
	if err != nil {
		return err
	}
	return nil
}

func BaiduyunAPITest(providerID string) error {
	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return err
	}
	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return fmt.Errorf("api配置错误")
	}
	// 解析 JSON 配置
	var providerConfig map[string]string
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return err
	}
	
	client, err := baiduyuncdn.ClientBaiduCdn(providerConfig["access_key"], providerConfig["secret_key"])
	_, _, err = client.ListDomains("")
	
	if err != nil {
		return fmt.Errorf("测试请求失败: %v", err)
	}
	return nil
}
