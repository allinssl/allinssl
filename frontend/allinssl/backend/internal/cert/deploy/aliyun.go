package deploy

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/internal/cert/deploy/client/aliyun"
	"encoding/json"
	"fmt"
	aliyuncdn "github.com/alibabacloud-go/cdn-20180510/v6/client"
	aliyunopenapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	aliyunmarket "github.com/alibabacloud-go/market-20151101/v4/client"
	"github.com/alibabacloud-go/tea/tea"
	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"strconv"
	"strings"
	"time"
)

func ClientAliCdn(accessKey, accessSecret string) (_result *aliyuncdn.Client, err error) {
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

func DeployAliCdn(cfg map[string]any) error {
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

	client, err := ClientAliCdn(providerConfig["access_key_id"], providerConfig["access_key_secret"])
	if err != nil {
		return err
	}
	domain, ok := cfg["domain"].(string)
	if !ok {
		return fmt.Errorf("参数错误：domain")
	}
	// 设置证书
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
	}

	setCdnDomainSSLCertificateRequest := &aliyuncdn.SetCdnDomainSSLCertificateRequest{
		DomainName:  tea.String(domain),
		SSLProtocol: tea.String("on"),
		SSLPub:      tea.String(strings.TrimSpace(certPem)),
		SSLPri:      tea.String(strings.TrimSpace(keyPem)),
	}
	_, err = client.SetCdnDomainSSLCertificate(setCdnDomainSSLCertificateRequest)
	if err != nil {
		return err
	}
	return nil
}

func ClientOss(accessKeyId, accessKeySecret, region string) (*oss.Client, error) {
	var endpoint string
	switch region {
	case "":
		endpoint = "oss.aliyuncs.com"
	case
		"cn-hzjbp",
		"cn-hzjbp-a",
		"cn-hzjbp-b":
		endpoint = "oss-cn-hzjbp-a-internal.aliyuncs.com"
	case
		"cn-shanghai-finance-1",
		"cn-shenzhen-finance-1",
		"cn-beijing-finance-1",
		"cn-north-2-gov-1":
		endpoint = fmt.Sprintf("oss-%s-internal.aliyuncs.com", region)
	default:
		endpoint = fmt.Sprintf("oss-%s.aliyuncs.com", region)
	}

	client, err := oss.New(endpoint, accessKeyId, accessKeySecret)
	if err != nil {
		return nil, err
	}

	return client, nil
}

func DeployOss(cfg map[string]any) error {
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
	region, ok := cfg["region"].(string)
	if !ok {
		return fmt.Errorf("参数错误：region")
	}

	client, err := ClientOss(providerConfig["access_key_id"], providerConfig["access_key_secret"], region)
	if err != nil {
		return err
	}
	domain, ok := cfg["domain"].(string)
	if !ok {
		return fmt.Errorf("参数错误：domain")
	}
	bucket, ok := cfg["bucket"].(string)
	if !ok {
		return fmt.Errorf("参数错误：bucket")
	}
	// 设置证书
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
	}

	putBucketCnameWithCertificateRequest := oss.PutBucketCname{
		Cname: domain,
		CertificateConfiguration: &oss.CertificateConfiguration{
			Certificate: certPem,
			PrivateKey:  keyPem,
			Force:       true,
		},
	}
	err = client.PutBucketCnameWithCertificate(bucket, putBucketCnameWithCertificateRequest)
	return err
}

func ClientMaker(accessKeyId, accessKeySecret string) (*aliyunmarket.Client, error) {
	config := &aliyunopenapi.Config{
		AccessKeyId:     tea.String(accessKeyId),
		AccessKeySecret: tea.String(accessKeySecret),
		Endpoint:        tea.String("market.aliyuncs.com"),
	}

	client, _ := aliyunmarket.NewClient(config)
	return client, nil
}

func AliyunCdnAPITest(providerID string) error {
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

	client, err := ClientMaker(providerConfig["access_key_id"], providerConfig["access_key_secret"])
	describeApiMeteringRequest := &aliyunmarket.DescribeApiMeteringRequest{
		PageNum: tea.Int32(1),
	}

	_, err = client.DescribeApiMetering(describeApiMeteringRequest)

	if err != nil {
		return fmt.Errorf("测试请求失败: %v", err)
	}
	return nil
}

func DeployAliyunWaf(cfg map[string]any) error {
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
	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return err
	}
	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return fmt.Errorf("api配置错误")
	}
	var providerConfig map[string]string
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return err
	}
	regionId, ok := cfg["region"].(string)
	if !ok {
		return fmt.Errorf("参数错误：region")
	}
	wafclient, err := aliyun.ClientAliWaf(providerConfig["access_key_id"], providerConfig["access_key_secret"], regionId)
	if err != nil {
		return err
	}
	domain, ok := cfg["domain"].(string)
	if !ok {
		return fmt.Errorf("参数错误：domain")
	}
	// 设置证书
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
	}
	//根据地区获取实例ID 目前一个地区只能有一个waf实例
	instanceId, err := wafclient.IGetInstanceId()
	if err != nil {
		return fmt.Errorf("获取地区实例ID失败: %v", err)
	}
	//查询接入详情
	domainDesc, err := wafclient.IDescribeDomainDetail(*instanceId, domain)
	if err != nil {
		return fmt.Errorf("获取域名配置详情失败: %v", err)
	}
	//上传证书
	certName := fmt.Sprintf("%s_allinssl_%d", domain, time.Now().UnixMilli())
	certId, err := wafclient.ICreateCerts(certName, certPem, keyPem, *instanceId)
	if err != nil {
		return fmt.Errorf("创建证书失败: %v", err)
	}
	//更新接入
	err = wafclient.IUpdateDomain(domainDesc, *instanceId, *certId)
	if err != nil {
		return fmt.Errorf("更新证书失败: %v", err)
	}

	return nil
}
