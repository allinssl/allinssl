package deploy

import (
	"ALLinSSL/backend/internal/access"
	"encoding/json"
	"fmt"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/errors"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	ssl "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/ssl/v20191205"
	"strconv"
	"strings"
)

func ClientTencentcloud(SecretId, SecretKey, region string) *ssl.Client {
	credential := common.NewCredential(
		SecretId,
		SecretKey,
	)
	// 实例化一个client选项，可选的，没有特殊需求可以跳过
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.Endpoint = "ssl.tencentcloudapi.com"
	// 实例化要请求产品的client对象,clientProfile是可选的
	client, _ := ssl.NewClient(credential, region, cpf)
	return client
}

func UploadToTX(client *ssl.Client, key, cert string) (string, error) {
	request := ssl.NewUploadCertificateRequest()
	request.CertificatePublicKey = common.StringPtr(cert)
	request.CertificatePrivateKey = common.StringPtr(key)
	request.Repeatable = common.BoolPtr(false)
	// 返回的resp是一个UploadCertificateResponse的实例，与请求对象对应
	response, err := client.UploadCertificate(request)
	if _, ok := err.(*errors.TencentCloudSDKError); ok {
		return "", err
	}
	if err != nil {
		return "", err
	}
	return *response.Response.CertificateId, nil
}

func DeployToTX(cfg map[string]any) error {
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
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
	region := ""
	if r, ok := cfg["region"].(string); ok {
		region = r
	}
	client := ClientTencentcloud(providerConfig["secret_id"], providerConfig["secret_key"], region)

	// 上传证书
	certificateId, err := UploadToTX(client, strings.TrimSpace(keyPem), strings.TrimSpace(certPem))
	if err != nil {
		return err
	}
	// fmt.Println(certificateId)

	request := ssl.NewDeployCertificateInstanceRequest()

	request.CertificateId = common.StringPtr(certificateId)
	resourceType := cfg["resource_type"].(string)
	switch resourceType {
	case "cdn", "waf", "teo":
		domain, ok := cfg["domain"].(string)
		if !ok {
			return fmt.Errorf("参数错误：domain")
		}
		domain = strings.TrimSpace(domain)
		domainArray := strings.Split(domain, ",")
		if len(domainArray) == 0 {
			return fmt.Errorf("参数错误：domain")
		}
		for i, d := range domainArray {
			domainArray[i] = strings.TrimSpace(d)
		}
		request.InstanceIdList = common.StringPtrs(domainArray)
		request.ResourceType = common.StringPtr(resourceType)
	case "cos":
		domain, ok := cfg["domain"].(string)
		if !ok {
			return fmt.Errorf("参数错误：domain")
		}
		region, ok := cfg["region"].(string)
		if !ok {
			return fmt.Errorf("参数错误：region")
		}
		bucket, ok := cfg["bucket"].(string)
		if !ok {
			return fmt.Errorf("参数错误：bucket")
		}
		request.InstanceIdList = common.StringPtrs([]string{fmt.Sprintf("%s|%s|%s", region, bucket, domain)})
		request.ResourceType = common.StringPtr("cos")
	}

	// 返回的resp是一个DeployCertificateInstanceResponse的实例，与请求对象对应
	response, err := client.DeployCertificateInstance(request)
	if _, ok := err.(*errors.TencentCloudSDKError); ok {
		return err
	}
	if err != nil {
		if _, ok := err.(*errors.TencentCloudSDKError); ok {
			return fmt.Errorf("腾讯云 API 错误: %v", err)
		}
		return fmt.Errorf("部署证书失败: %v", err)
	}
	if response == nil || response.Response == nil {
		return fmt.Errorf("部署证书失败: 响应为空")
	}
	if *response.Response.DeployStatus != 1 {
		return fmt.Errorf("腾讯云当前存在部署中的任务，未创建新的部署任务，部署中的任务ID为：%d", *response.Response.DeployRecordId)
	}
	return nil
}

func TencentCloudAPITest(providerID string) error {
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

	// 创建客户端
	client := ClientTencentcloud(providerConfig["secret_id"], providerConfig["secret_key"], "")

	request := ssl.NewDescribeCertificatesRequest()
	_, err = client.DescribeCertificates(request)
	if err != nil {
		return fmt.Errorf("测试请求失败: %v", err)
	}

	return nil
}
