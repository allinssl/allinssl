package deploy

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/errors"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	ssl "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/ssl/v20191205"
	teo "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/teo/v20220901"
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

// ClientTencentcloudTEO 创建 EdgeOne (TEO) 客户端
func ClientTencentcloudTEO(SecretId, SecretKey, region string) *teo.Client {
	credential := common.NewCredential(
		SecretId,
		SecretKey,
	)
	// 实例化一个client选项
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.Endpoint = "teo.tencentcloudapi.com"
	// 实例化 EdgeOne client对象
	client, _ := teo.NewClient(credential, region, cpf)
	return client
}

func UploadToTX(client *ssl.Client, key, cert string) (string, error) {
	request := ssl.NewUploadCertificateRequest()
	request.CertificatePublicKey = common.StringPtr(cert)
	request.CertificatePrivateKey = common.StringPtr(key)
	request.Repeatable = common.BoolPtr(false)

	response, err := client.UploadCertificate(request)

	if err != nil {
		if sdkErr, ok := err.(*errors.TencentCloudSDKError); ok {
			return "", fmt.Errorf("腾讯云 API 错误 [%s]: %s (RequestId: %s)",
				sdkErr.Code, sdkErr.Message, sdkErr.RequestId)
		}
		return "", fmt.Errorf("上传证书失败: %v", err)
	}

	if response == nil || response.Response == nil {
		return "", fmt.Errorf("上传证书失败: 响应为空")
	}

	if response.Response.CertificateId == nil {
		return "", fmt.Errorf("上传证书失败: 证书ID为空")
	}

	certificateId := *response.Response.CertificateId
	return certificateId, nil
}

// DeployToEdgeOne 使用 EdgeOne API 部署证书到 EdgeOne 域名
func DeployToEdgeOne(teoClient *teo.Client, zoneId string, domains []string, certId string, logger *public.Logger) error {
	// 构建 ServerCertInfo 列表
	var serverCertInfos []*teo.ServerCertInfo
	for range domains {
		certInfo := &teo.ServerCertInfo{
			CertId: common.StringPtr(certId),
		}
		serverCertInfos = append(serverCertInfos, certInfo)
	}

	// 创建 ModifyHostsCertificate 请求
	request := teo.NewModifyHostsCertificateRequest()
	request.ZoneId = common.StringPtr(zoneId)
	request.Hosts = common.StringPtrs(domains)
	request.Mode = common.StringPtr("sslcert") // 指定使用SSL证书模式
	request.ServerCertInfo = serverCertInfos

	response, err := teoClient.ModifyHostsCertificate(request)

	if err != nil {
		if sdkErr, ok := err.(*errors.TencentCloudSDKError); ok {
			return fmt.Errorf("EO API 错误 [%s]: %s (RequestId: %s)",
				sdkErr.Code, sdkErr.Message, sdkErr.RequestId)
		}
		return fmt.Errorf("EO 部署证书失败: %v", err)
	}

	if response == nil || response.Response == nil {
		return fmt.Errorf("EO 部署失败: 响应为空")
	}

	// 记录部署成功的详细信息到工作流日志
	logger.Debug(fmt.Sprintf("部署成功 - Zone: %s, 域名: %v, 证书ID: %s", zoneId, domains, certId))

	return nil
}

func DeployToTX(cfg map[string]any, logger *public.Logger) error {
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

	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return fmt.Errorf("获取访问配置失败: %v", err)
	}
	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return fmt.Errorf("api配置错误")
	}

	var providerConfig map[string]string
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return fmt.Errorf("解析配置JSON失败: %v", err)
	}

	region := ""
	if r, ok := cfg["region"].(string); ok {
		region = r
	}

	client := ClientTencentcloud(providerConfig["secret_id"], providerConfig["secret_key"], region)

	// 上传证书
	certificateId, err := UploadToTX(client, strings.TrimSpace(keyPem), strings.TrimSpace(certPem))
	if err != nil {
		return fmt.Errorf("上传证书失败: %v", err)
	}

	resourceType := cfg["resource_type"].(string)

	// EdgeOne (teo) 使用专用的 EdgeOne API
	if resourceType == "teo" {
		// 获取域名配置，第一个值作为 zone_id，后续值作为实际部署域名
		domain, ok := cfg["domain"].(string)
		if !ok {
			return fmt.Errorf("参数错误：domain")
		}
		domain = strings.TrimSpace(domain)
		domainArray := strings.Split(domain, ",")
		if len(domainArray) == 0 {
			return fmt.Errorf("参数错误：domain，EdgeOne 部署需要至少配置一个值")
		}

		// 清理空格
		for i, d := range domainArray {
			domainArray[i] = strings.TrimSpace(d)
		}

		// 第一个值作为 zone_id，后续的值作为实际要部署的域名
		zoneId := domainArray[0]

		// 验证 zone_id 格式：应该以 "zone-" 开头
		if !strings.HasPrefix(zoneId, "zone-") {
			logger.Debug(fmt.Sprintf("提示：EO 域名列表第一个值不是有效的 zone_id 格式（应以 'zone-' 开头）: %s", zoneId))
			return fmt.Errorf("EO 部署失败：第一个值必须是 zone_id（格式：zone-xxxxx），当前值：%s。配置格式：zone_id,域名1,域名2,... 例如：zone-xxxxx,www.example.com,*.example.com", zoneId)
		}

		var actualDomains []string
		if len(domainArray) > 1 {
			actualDomains = domainArray[1:]
		} else {
			return fmt.Errorf("EO 部署需要配置格式：zone_id,域名1,域名2,... 例如：zone-xxxxx,www.example.com,*.example.com")
		}

		// 记录部署信息到工作流日志
		logger.Debug(fmt.Sprintf("开始部署到 EO - Zone: %s, 目标域名: %v", zoneId, actualDomains))

		// 创建 EdgeOne 客户端
		teoClient := ClientTencentcloudTEO(providerConfig["secret_id"], providerConfig["secret_key"], region)

		// 使用 EdgeOne API 部署
		return DeployToEdgeOne(teoClient, zoneId, actualDomains, certificateId, logger)
	}

	// 对于 CDN 和 WAF,继续使用 SSL 部署 API
	request := ssl.NewDeployCertificateInstanceRequest()
	request.CertificateId = common.StringPtr(certificateId)

	switch resourceType {
	case "cdn", "waf":
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
		cosInstanceId := fmt.Sprintf("%s|%s|%s", region, bucket, domain)
		request.InstanceIdList = common.StringPtrs([]string{cosInstanceId})
		request.ResourceType = common.StringPtr("cos")
	}

	response, err := client.DeployCertificateInstance(request)

	if err != nil {
		if sdkErr, ok := err.(*errors.TencentCloudSDKError); ok {
			return fmt.Errorf("腾讯云 API 错误 [%s]: %s (RequestId: %s)",
				sdkErr.Code, sdkErr.Message, sdkErr.RequestId)
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
