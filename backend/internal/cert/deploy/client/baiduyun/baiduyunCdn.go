package baiduyun

import (
	"fmt"
	baiduyuncdn "github.com/baidubce/bce-sdk-go/services/cdn"
	"github.com/baidubce/bce-sdk-go/services/cdn/api"
)

type BaiduyunCdnClient struct {
	baiduyuncdn.Client
}

func ClientBaiduCdn(ak, sk string) (*BaiduyunCdnClient, error) {
	client, err := baiduyuncdn.NewClient(ak, sk, "https://cdn.baidubce.com")
	if err != nil {
		return nil, err
	}
	baiduCdnClient := &BaiduyunCdnClient{
		Client: *client,
	}
	return baiduCdnClient, nil
}

func (client *BaiduyunCdnClient) IPutCert(domain, certName, certContent, certKey string) (string, error) {
	certId, err := client.PutCert(domain, &api.UserCertificate{
		CertName:    certName,
		ServerData:  certContent,
		PrivateData: certKey,
	}, "ON")
	
	if err != nil {
		return "", fmt.Errorf("修改域名证书失败: %v", err)
	}
	return certId, nil
}
