package cas

import (
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

func UploadToCas(client *cas.Client, cert, key, name string) error {
	uploadUserCertificateRequest := &cas.UploadUserCertificateRequest{
		Name: tea.String(name),
		Cert: tea.String(cert),
		Key:  tea.String(key),
	}
	runtime := &util.RuntimeOptions{}
	_, err := client.UploadUserCertificateWithOptions(uploadUserCertificateRequest, runtime)
	return err
}
