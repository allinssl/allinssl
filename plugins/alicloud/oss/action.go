package osswrap

import (
	"fmt"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

func createClient(accessKeyId, accessKeySecret, region string) (*oss.Client, error) {
	var endpoint string
	switch region {
	case "":
		endpoint = "oss.aliyuncs.com"
	case "cn-hzjbp", "cn-hzjbp-a", "cn-hzjbp-b":
		endpoint = "oss-cn-hzjbp-a-internal.aliyuncs.com"
	case "cn-shanghai-finance-1", "cn-shenzhen-finance-1", "cn-beijing-finance-1", "cn-north-2-gov-1":
		endpoint = fmt.Sprintf("oss-%s-internal.aliyuncs.com", region)
	default:
		endpoint = fmt.Sprintf("oss-%s.aliyuncs.com", region)
	}
	return oss.New(endpoint, accessKeyId, accessKeySecret)
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
	region, ok := cfg["region"].(string)
	if !ok || region == "" {
		return fmt.Errorf("参数错误：region")
	}
	bucket, ok := cfg["bucket"].(string)
	if !ok || bucket == "" {
		return fmt.Errorf("参数错误：bucket")
	}
	domain, ok := cfg["domain"].(string)
	if !ok || domain == "" {
		return fmt.Errorf("参数错误：domain")
	}
	client, err := createClient(accessKey, accessSecret, region)
	if err != nil {
		return err
	}
	putReq := oss.PutBucketCname{
		Cname:                    domain,
		CertificateConfiguration: &oss.CertificateConfiguration{Certificate: certPEM, PrivateKey: keyPEM, Force: true},
	}
	return client.PutBucketCnameWithCertificate(bucket, putReq)
}
