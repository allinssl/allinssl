package cdn

import (
	"fmt"
	"strings"

	aliyuncdn "github.com/alibabacloud-go/cdn-20180510/v6/client"
	aliyunopenapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	"github.com/alibabacloud-go/tea/tea"
)

func createClient(accessKey, accessSecret string) (*aliyuncdn.Client, error) {
	config := &aliyunopenapi.Config{
		AccessKeyId:     tea.String(accessKey),
		AccessKeySecret: tea.String(accessSecret),
		Endpoint:        tea.String("cdn.aliyuncs.com"),
	}
	client, err := aliyuncdn.NewClient(config)
	if err != nil {
		return nil, err
	}
	return client, nil
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
		return err
	}
	req := &aliyuncdn.SetCdnDomainSSLCertificateRequest{
		DomainName:  tea.String(domain),
		SSLProtocol: tea.String("on"),
		SSLPub:      tea.String(strings.TrimSpace(certPEM)),
		SSLPri:      tea.String(strings.TrimSpace(keyPEM)),
	}
	_, err = client.SetCdnDomainSSLCertificate(req)
	return err
}
