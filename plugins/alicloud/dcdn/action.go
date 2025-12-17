package dcdn

import (
	"fmt"

	aliyunopenapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	dcdn "github.com/alibabacloud-go/dcdn-20180115/v3/client"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
)

func createClient(accessKey, accessSecret string) (*dcdn.Client, error) {
	config := &aliyunopenapi.Config{
		AccessKeyId:     tea.String(accessKey),
		AccessKeySecret: tea.String(accessSecret),
		RegionId:        tea.String("cn-hangzhou"),
	}
	return dcdn.NewClient(config)
}

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
	domain, ok := cfg["domain"].(string)
	if !ok || domain == "" {
		return fmt.Errorf("参数错误：domain")
	}
	client, err := createClient(accessKey, accessSecret)
	if err != nil {
		return fmt.Errorf("创建 DCDN 客户端失败: %w", err)
	}
	req := &dcdn.SetDcdnDomainSSLCertificateRequest{
		DomainName:  tea.String(domain),
		SSLPri:      tea.String(keyPEM),
		SSLPub:      tea.String(certPEM),
		SSLProtocol: tea.String("on"),
		CertType:    tea.String("upload"),
	}
	runtime := &util.RuntimeOptions{}
	_, err = client.SetDcdnDomainSSLCertificateWithOptions(req, runtime)
	return err
}
