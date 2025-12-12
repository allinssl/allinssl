package aliyun

import (
	aliyuncas "github.com/alibabacloud-go/cas-20200407/v4/client"
	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	"github.com/alibabacloud-go/tea/tea"
)

type AliyunCasClient struct {
	aliyuncas.Client
}

func ClientAliCas(accessKey, accessSecret string) (_result *AliyunCasClient, err error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(accessKey),
		AccessKeySecret: tea.String(accessSecret),
		Endpoint:        tea.String("cas.aliyuncs.com"),
	}
	casClient, err := aliyuncas.NewClient(config)
	if err != nil {
		return nil, err
	}
	
	client := &AliyunCasClient{
		Client: *casClient,
	}
	return client, nil
}

func (c *AliyunCasClient) UploadCert(certName, certContent, certKey string) (*int64, error) {
	certificateRequest := &aliyuncas.UploadUserCertificateRequest{
		Cert: tea.String(certContent),
		Key:  tea.String(certKey),
		Name: tea.String(certName),
	}
	uploadUserCertificateResp, err := c.UploadUserCertificate(certificateRequest)
	if err != nil {
		return nil, err
	}
	
	return uploadUserCertificateResp.Body.CertId, nil
}
