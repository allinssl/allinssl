package deploy

import (
	"ALLinSSL/backend/internal/access"
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/cloudfront"
	cftypes "github.com/aws/aws-sdk-go-v2/service/cloudfront/types"
	"github.com/aws/aws-sdk-go-v2/service/iam"
)

// DeployAWSCloudFront uploads the certificate to AWS IAM and associates it with a
// CloudFront distribution. This is the correct approach for AWS China regions where
// ACM is not supported for CloudFront.
//
// Required cfg fields:
//   - certificate: map with "cert" (PEM) and "key" (PEM)
//   - provider_id: ID referencing the AWS access config (access_key_id, secret_access_key, region)
//   - domain: CloudFront Distribution ID (e.g. "E1234567890ABC")
func DeployAWSCloudFront(cfg map[string]any) error {
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
	if err = json.Unmarshal([]byte(providerConfigStr), &providerConfig); err != nil {
		return err
	}

	accessKeyID := providerConfig["access_key_id"]
	secretAccessKey := providerConfig["secret_access_key"]
	region := providerConfig["region"]
	if region == "" {
		region = "us-east-1"
	}

	distributionID, ok := cfg["domain"].(string)
	if !ok || distributionID == "" {
		return fmt.Errorf("参数错误：domain（请填写 CloudFront Distribution ID）")
	}

	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
	}

	// Split full-chain PEM into leaf cert + chain.
	leafCert, chainCerts := splitPEMChain(certPem)

	ctx := context.Background()
	creds := credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, "")

	// IAM is global, but for AWS China it is regional.
	// CloudFront (global) requires IAM certs uploaded in us-east-1.
	// For AWS China, IAM certs live in the configured China region.
	iamRegion := "us-east-1"
	if strings.HasPrefix(region, "cn-") {
		iamRegion = region
	}

	iamCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(iamRegion),
		awsconfig.WithCredentialsProvider(creds),
	)
	if err != nil {
		return fmt.Errorf("AWS IAM 配置失败: %v", err)
	}

	iamClient := iam.NewFromConfig(iamCfg)

	// Generate a unique name for the IAM server certificate.
	certName := fmt.Sprintf("allinssl-%s-%d", strings.ReplaceAll(distributionID, ".", "-"), time.Now().Unix())

	uploadInput := &iam.UploadServerCertificateInput{
		ServerCertificateName: aws.String(certName),
		CertificateBody:       aws.String(strings.TrimSpace(leafCert)),
		PrivateKey:            aws.String(strings.TrimSpace(keyPem)),
		Path:                  aws.String("/cloudfront/"),
	}
	if chainCerts != "" {
		uploadInput.CertificateChain = aws.String(strings.TrimSpace(chainCerts))
	}

	uploadResp, err := iamClient.UploadServerCertificate(ctx, uploadInput)
	if err != nil {
		return fmt.Errorf("上传 IAM 证书失败: %v", err)
	}
	iamCertID := aws.ToString(uploadResp.ServerCertificateMetadata.ServerCertificateId)

	// CloudFront is always accessed via its own endpoint region.
	cfCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(region),
		awsconfig.WithCredentialsProvider(creds),
	)
	if err != nil {
		return fmt.Errorf("CloudFront 配置失败: %v", err)
	}

	cfClient := cloudfront.NewFromConfig(cfCfg)

	// Fetch current distribution config and ETag (required for update).
	getResp, err := cfClient.GetDistribution(ctx, &cloudfront.GetDistributionInput{
		Id: aws.String(distributionID),
	})
	if err != nil {
		return fmt.Errorf("获取 CloudFront 分配配置失败: %v", err)
	}

	distConfig := getResp.Distribution.DistributionConfig
	distConfig.ViewerCertificate = &cftypes.ViewerCertificate{
		IAMCertificateId:       aws.String(iamCertID),
		SSLSupportMethod:       cftypes.SSLSupportMethodSniOnly,
		MinimumProtocolVersion: cftypes.MinimumProtocolVersionTLSv122021,
	}

	_, err = cfClient.UpdateDistribution(ctx, &cloudfront.UpdateDistributionInput{
		Id:                 aws.String(distributionID),
		IfMatch:            getResp.ETag,
		DistributionConfig: distConfig,
	})
	if err != nil {
		return fmt.Errorf("更新 CloudFront 分配失败: %v", err)
	}

	return nil
}

// splitPEMChain splits a PEM bundle into the first certificate (leaf) and the
// remainder (intermediate chain). Returns the chain as an empty string when the
// bundle contains only one certificate.
func splitPEMChain(pem string) (leaf, chain string) {
	const header = "-----BEGIN CERTIFICATE-----"
	first := strings.Index(pem, header)
	if first == -1 {
		return pem, ""
	}
	second := strings.Index(pem[first+len(header):], header)
	if second == -1 {
		return pem, ""
	}
	splitAt := first + len(header) + second
	return pem[:splitAt], pem[splitAt:]
}
