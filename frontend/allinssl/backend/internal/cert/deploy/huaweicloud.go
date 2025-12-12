package deploy

import (
	"ALLinSSL/backend/internal/access"
	"encoding/json"
	"fmt"
	"github.com/huaweicloud/huaweicloud-sdk-go-v3/core/auth/global"
	cdn "github.com/huaweicloud/huaweicloud-sdk-go-v3/services/cdn/v2"
	"github.com/huaweicloud/huaweicloud-sdk-go-v3/services/cdn/v2/model"
	region "github.com/huaweicloud/huaweicloud-sdk-go-v3/services/cdn/v2/region"
	"strconv"
	"time"
)

func CreateHwAuth(accessKey, accessSecret string) (*global.Credentials, error) {
	return global.NewCredentialsBuilder().WithAk(accessKey).WithSk(accessSecret).SafeBuild()
}

func ClientHwCdn(auth *global.Credentials) (*cdn.CdnClient, error) {
	if auth == nil {
		return nil, fmt.Errorf("authentication credentials cannot be nil")
	}
	Region, err := region.SafeValueOf("cn-north-1")
	if err != nil {
		return nil, fmt.Errorf("failed to get region: %v", err)
	}
	builder, err := cdn.CdnClientBuilder().WithRegion(Region).WithCredential(auth).SafeBuild()
	if err != nil {
		return nil, fmt.Errorf("failed to build CDN client: %v", err)
	}
	return cdn.NewCdnClient(builder), nil
}

func DeployHwCdn(cfg map[string]any) error {
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

	auth, err := CreateHwAuth(providerConfig["access_key"], providerConfig["secret_key"])
	if err != nil {
		return err
	}
	client, err := ClientHwCdn(auth)
	if err != nil {
		return err
	}
	request := &model.UpdateDomainMultiCertificatesRequest{}
	certNameHttps := fmt.Sprintf("ALLinSSL(%s)", time.Now().String())
	httpsbody := &model.UpdateDomainMultiCertificatesRequestBodyContent{
		DomainName:  domain,
		HttpsSwitch: int32(1),
		CertName:    &certNameHttps,
		Certificate: &certPem,
		PrivateKey:  &keyPem,
	}
	request.Body = &model.UpdateDomainMultiCertificatesRequestBody{
		Https: httpsbody,
	}
	response, err := client.UpdateDomainMultiCertificates(request)
	if err == nil {
		fmt.Printf("%+v\n", response)
	} else {
		return fmt.Errorf("failed to update domain multi certificates: %v", err)
	}
	return nil
}
