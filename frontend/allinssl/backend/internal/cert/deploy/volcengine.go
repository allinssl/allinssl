package deploy

import (
	"ALLinSSL/backend/internal/access"
	volccdn "ALLinSSL/backend/internal/cert/deploy/client/volcengine"
	"encoding/json"
	"fmt"
	"strconv"
)

func DeployVolcEngineCdn(cfg map[string]any) error {
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
	region, ok := cfg["region"].(string)
	if !ok {
		return fmt.Errorf("参数错误：region")
	}
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
	
	client, err := volccdn.ClientVolcEngineCdn(providerConfig["access_key"], providerConfig["secret_key"], region)
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
	
	certId, err := client.IUploadCert(certPem, keyPem)
	if err != nil {
		return fmt.Errorf("上传证书失败: %w", err)
	}
	err = client.IBatchDeployCert(certId, domain)
	if err != nil {
		return fmt.Errorf("部署证书失败: %w", err)
	}
	
	if err != nil {
		return err
	}
	return nil
}

func DeployVolcEngineDCdn(cfg map[string]any) error {
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
	region, ok := cfg["region"].(string)
	if !ok {
		return fmt.Errorf("参数错误：region")
	}
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
	
	cdnClient, err := volccdn.ClientVolcEngineCdn(providerConfig["access_key"], providerConfig["secret_key"], region)
	dcdnDlient, err := volccdn.ClientVolcEngineDcdn(providerConfig["access_key"], providerConfig["secret_key"], region)
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
	
	certId, err := cdnClient.IUploadCert(certPem, keyPem)
	if err != nil {
		return fmt.Errorf("上传证书失败: %w", err)
	}
	err = dcdnDlient.IDCDNCreateCertBindInput(certId, domain)
	if err != nil {
		return fmt.Errorf("部署证书失败: %w", err)
	}
	
	if err != nil {
		return err
	}
	return nil
}