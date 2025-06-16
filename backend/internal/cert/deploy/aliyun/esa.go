package aliyun

import (
	"ALLinSSL/backend/internal/access"
	"encoding/json"
	"fmt"
	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	esa "github.com/alibabacloud-go/esa-20240910/v2/client"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
	"strconv"
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

func DeployAliyunESA(cfg map[string]any) error {
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

	switch cfg["site_id"].(type) {
	case float64:
		cfg["site_id"] = int64(cfg["site_id"].(float64))
	case string:
		siteID, err := strconv.ParseInt(cfg["site_id"].(string), 10, 64)
		if err != nil {
			return fmt.Errorf("site_id 格式错误: %w", err)
		}
		cfg["site_id"] = siteID
	case int:
		cfg["site_id"] = cfg["site_id"].(int64)
	default:
		return fmt.Errorf("site_id 格式错误")
	}

	client, err := CreateEsaClient(providerConfig["access_key_id"], providerConfig["access_key_secret"])
	if err != nil {
		return fmt.Errorf("创建 ESA 客户端失败: %w", err)
	}
	certPEM, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书内容不存在或格式错误")
	}
	privkeyPEM, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("私钥内容不存在或格式错误")
	}
	err = UploadCertToESA(client, cfg["site_id"].(int64), certPEM, privkeyPEM)
	if err != nil {
		return fmt.Errorf("上传证书到 ESA 失败: %w", err)
	}
	return nil
}
