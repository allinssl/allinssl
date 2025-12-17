package cas

import (
	"fmt"

	cas "github.com/alibabacloud-go/cas-20200407/v4/client"
	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
)

func CreateClient(accessKey, accessSecret, endpoint string) (*cas.Client, error) {
	if endpoint == "" {
		endpoint = "cas.ap-southeast-1.aliyuncs.com"
	}
	config := &openapi.Config{
		AccessKeyId:     tea.String(accessKey),
		AccessKeySecret: tea.String(accessSecret),
		Endpoint:        tea.String(endpoint),
	}
	return cas.NewClient(config)
}

func Upload(client *cas.Client, cert, key, name string) error {
	req := &cas.UploadUserCertificateRequest{
		Name: tea.String(name),
		Cert: tea.String(cert),
		Key:  tea.String(key),
	}
	runtime := &util.RuntimeOptions{}
	_, err := client.UploadUserCertificateWithOptions(req, runtime)
	return err
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
	name, _ := cfg["name"].(string)
	if name == "" {
		name = "allinssl-certificate"
	}
	endpoint, _ := cfg["endpoint"].(string)
	client, err := CreateClient(accessKey, accessSecret, endpoint)
	if err != nil {
		return err
	}
	if err := Upload(client, certPEM, keyPEM, name); err != nil {
		return err
	}
	return nil
}
