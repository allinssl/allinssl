package deploy

import (
	"fmt"
	"github.com/volcengine/volcengine-go-sdk/service/dcdn"
	"github.com/volcengine/volcengine-go-sdk/volcengine"
)

type VolcEngineDcdnClient struct {
	*dcdn.DCDN
}

func ClientVolcEngineDcdn(ak, sk, region string) (*VolcEngineDcdnClient, error) {
	sess, err := createSdkSession(ak, sk, region)
	if err != nil {
		return nil, fmt.Errorf("创建火山引擎DCDN客户端失败: %w", err)
	}
	dcdnClient := &VolcEngineDcdnClient{
		DCDN: dcdn.New(sess),
	}
	return dcdnClient, nil
}

func (v *VolcEngineDcdnClient) IDCDNCreateCertBindInput(certId, domain string) error {
	createCertBindInput := &dcdn.CreateCertBindInput{
		CertId:      volcengine.String(certId),
		DomainNames: volcengine.StringSlice([]string{domain}),
	}
	
	_, err := v.CreateCertBind(createCertBindInput)
	if err != nil {
		return fmt.Errorf("部署证书失败: %w", err)
	}
	return err
}
