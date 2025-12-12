package esa

import (
	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	esa "github.com/alibabacloud-go/esa-20240910/v2/client"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
)

// CreateEsaClient creates a new ESA client with the provided access key and secret.
func CreateEsaClient(accessKey, accessSecret string) (*esa.Client, error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(accessKey),
		AccessKeySecret: tea.String(accessSecret),
		Endpoint:        tea.String("esa.ap-southeast-1.aliyuncs.com"),
	}
	return esa.NewClient(config)
}

// UploadCertToESA uploads the certificate and private key to Alibaba Cloud ESA.
func UploadCertToESA(client *esa.Client, id int64, certPEM, privkeyPEM string) error {
	req := esa.SetCertificateRequest{
		SiteId:      tea.Int64(id),
		Type:        tea.String("upload"),
		Certificate: tea.String(certPEM),
		PrivateKey:  tea.String(privkeyPEM),
	}
	runtime := &util.RuntimeOptions{}

	_, err := client.SetCertificateWithOptions(&req, runtime)
	if err != nil {
		return err
	}
	return nil
}

// ListCertFromESA retrieves the list of certificates from Alibaba Cloud ESA for a given site ID.
func ListCertFromESA(client *esa.Client, id int64) ([]*esa.ListCertificatesResponseBodyResult, error) {
	req := esa.ListCertificatesRequest{
		SiteId: tea.Int64(id),
	}
	runtime := &util.RuntimeOptions{}
	resp, err := client.ListCertificatesWithOptions(&req, runtime)
	if err != nil {
		return nil, err
	}
	return resp.Body.Result, nil
}

// DeleteEsaCert deletes a certificate from Alibaba Cloud ESA by its ID.
func DeleteEsaCert(client *esa.Client, id int64, certID string) error {
	req := esa.DeleteCertificateRequest{
		SiteId: tea.Int64(id),
		Id:     tea.String(certID),
	}
	runtime := &util.RuntimeOptions{}

	_, err := client.DeleteCertificateWithOptions(&req, runtime)
	if err != nil {
		return err
	}
	return nil
}
