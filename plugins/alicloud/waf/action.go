package waf

import (
	"fmt"
	"time"
)

func Deploy(cfg map[string]any) error {
	certPEM, ok := cfg["cert"].(string)
	if !ok || certPEM == "" {
		return fmt.Errorf("证书错误：cert")
	}
	keyPEM, ok := cfg["key"].(string)
	if !ok || keyPEM == "" {
		return fmt.Errorf("证书错误：key")
	}
	accessKey, ok := cfg["access_key_id"].(string)
	if !ok || accessKey == "" {
		return fmt.Errorf("参数错误：access_key_id")
	}
	accessSecret, ok := cfg["access_key_secret"].(string)
	if !ok || accessSecret == "" {
		return fmt.Errorf("参数错误：access_key_secret")
	}
	region, ok := cfg["region"].(string)
	if !ok || region == "" {
		return fmt.Errorf("参数错误：region")
	}
	domain, ok := cfg["domain"].(string)
	if !ok || domain == "" {
		return fmt.Errorf("参数错误：domain")
	}
	client, err := ClientAliWaf(accessKey, accessSecret, region)
	if err != nil {
		return err
	}
	instanceId, err := client.IGetInstanceId()
	if err != nil {
		return fmt.Errorf("获取地区实例ID失败: %v", err)
	}
	domainDesc, err := client.IDescribeDomainDetail(*instanceId, domain)
	if err != nil {
		return fmt.Errorf("获取域名配置详情失败: %v", err)
	}
	certName := fmt.Sprintf("%s_allinssl_%d", domain, time.Now().UnixMilli())
	certId, err := client.ICreateCerts(certName, certPEM, keyPEM, *instanceId)
	if err != nil {
		return fmt.Errorf("创建证书失败: %v", err)
	}
	if err := client.IUpdateDomain(domainDesc, *instanceId, *certId); err != nil {
		return fmt.Errorf("更新证书失败: %v", err)
	}
	return nil
}
