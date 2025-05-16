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
	if cfg["resource_type"] == "cdn" {
		domain, ok := cfg["domain"].(string)
		if !ok {
			return fmt.Errorf("参数错误：domain")
		}
		request.InstanceIdList = common.StringPtrs([]string{domain})
		request.ResourceType = common.StringPtr("cdn")
	}
	if cfg["resource_type"] == "cos" {
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
		panic(err)
	}
	fmt.Println(response.Response.DeployRecordId)
	return nil
}
