package deploy

import (
	"fmt"
	"github.com/volcengine/volcengine-go-sdk/service/cdn"
	"github.com/volcengine/volcengine-go-sdk/volcengine"
	"github.com/volcengine/volcengine-go-sdk/volcengine/credentials"
	"github.com/volcengine/volcengine-go-sdk/volcengine/session"
	"regexp"
)

type VolcEngineCdnClient struct {
	*cdn.CDN
}

func ClientVolcEngineCdn(ak, sk, region string) (*VolcEngineCdnClient, error) {
	config := volcengine.NewConfig().
		WithRegion(region).
		WithCredentials(credentials.NewStaticCredentials(ak, sk, ""))
	sess, err := session.NewSession(config)
	if err != nil {
		return nil, fmt.Errorf("创建火山引擎CDN客户端失败: %w", err)
	}
	cdnClient := &VolcEngineCdnClient{
		CDN: cdn.New(sess),
	}
	return cdnClient, nil
}

func (v *VolcEngineCdnClient) IUploadCert(certContent, certKey string) (string, error) {
	// 创建证书上传请求
	input := &cdn.AddCertificateInput{
		Certificate: volcengine.String(certContent),
		PrivateKey:  volcengine.String(certKey),
		Repeatable:  volcengine.Bool(false),
		Source:      volcengine.String("volc_cert_center"),
	}
	
	output, err := v.AddCertificate(input)
	if err != nil {
		if output.Metadata.Error.Code == "InvalidParameter.Certificate.Duplicated" {
			re := regexp.MustCompile(`cert-[a-f0-9]{32}`)
			certId := re.FindString(output.Metadata.Error.Message)
			fmt.Printf("相同证书已存在 certId:%s\n", certId)
			return certId, nil
		}
		return "", fmt.Errorf("上传证书失败: %w", err)
	}
	return *output.CertId, nil
}

func (v *VolcEngineCdnClient) IBatchDeployCert(certId, domain string) error {
	batchDeployCertInput := &cdn.BatchDeployCertInput{
		CertId: volcengine.String(certId),
		Domain: volcengine.String(domain),
	}
	
	res, err := v.BatchDeployCert(batchDeployCertInput)
	if err != nil {
		return fmt.Errorf("部署证书失败: %w", err)
	}
	if *res.DeployResult[0].Status != "success" {
		return fmt.Errorf("部署证书失败: %s", *res.DeployResult[0].ErrorMsg)
	}
	return err
}
