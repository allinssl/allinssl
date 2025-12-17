package esa

import (
	"fmt"
	"strconv"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	esa "github.com/alibabacloud-go/esa-20240910/v2/client"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
)

func CreateClient(accessKey, accessSecret string) (*esa.Client, error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(accessKey),
		AccessKeySecret: tea.String(accessSecret),
		Endpoint:        tea.String("esa.ap-southeast-1.aliyuncs.com"),
	}
	return esa.NewClient(config)
}

func UploadCert(client *esa.Client, siteID int64, certPEM, keyPEM string) error {
	req := esa.SetCertificateRequest{
		SiteId:      tea.Int64(siteID),
		Type:        tea.String("upload"),
		Certificate: tea.String(certPEM),
		PrivateKey:  tea.String(keyPEM),
	}
	runtime := &util.RuntimeOptions{}
	_, err := client.SetCertificateWithOptions(&req, runtime)
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
	var siteID int64
	switch v := cfg["site_id"].(type) {
	case float64:
		siteID = int64(v)
	case string:
		var err error
		siteID, err = strconv.ParseInt(v, 10, 64)
		if err != nil {
			return fmt.Errorf("site_id 格式错误: %w", err)
		}
	case int:
		siteID = int64(v)
	default:
		return fmt.Errorf("site_id 格式错误")
	}
	client, err := CreateClient(accessKey, accessSecret)
	if err != nil {
		return fmt.Errorf("创建 ESA 客户端失败: %w", err)
	}
	if err := UploadCert(client, siteID, certPEM, keyPEM); err != nil {
		return fmt.Errorf("上传证书到 ESA 失败: %w", err)
	}
	return nil
}
