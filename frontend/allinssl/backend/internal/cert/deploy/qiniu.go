package deploy

import (
	"ALLinSSL/backend/internal/access"
	"context"
	"encoding/json"
	"fmt"
	"github.com/qiniu/go-sdk/v7/auth"
	"github.com/qiniu/go-sdk/v7/client"
	"net/http"
	"strconv"
)

type commonResponse struct {
	Code  int    `json:"code"`
	Error string `json:"error"`
}

type sslCertResponse struct {
	CertID string `json:"certID"`
}

func requestQiniu(cfg map[string]any, path string, m map[string]any, method string, response any) (err error) {
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

	uri := fmt.Sprintf("https://api.qiniu.com/%v", path)
	credentials := auth.New(providerConfig["access_key"], providerConfig["access_secret"])
	header := http.Header{}
	header.Add("Content-Type", "application/json")
	err = client.DefaultClient.CredentialedCallWithJson(context.Background(), credentials, auth.TokenQBox, response, method, uri, header, m)
	return err
}

func DeployQiniuCdn(cfg map[string]any) error {
	_, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	domain, ok := cfg["domain"].(string)
	if !ok {
		return fmt.Errorf("参数错误：domain")
	}

	certId, err := uploadQiniuCert(cfg)
	if err != nil {
		return err
	}
	path := fmt.Sprintf("domain/%v/sslize", domain)
	m := map[string]any{
		"certid": certId,
	}
	var response commonResponse
	err = requestQiniu(cfg, path, m, "PUT", &response)
	return err
}

func updateQiniuDomainCert(cfg map[string]any) error {
	_, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}

	domain, ok := cfg["domain"].(string)
	if !ok {
		return fmt.Errorf("参数错误：domain")
	}

	forceHttps, ok := cfg["force_https"].(bool)
	if !ok {
		forceHttps = true
	}

	http2Enable, ok := cfg["http2_enable"].(bool)
	if !ok {
		http2Enable = true
	}

	certId, err := uploadQiniuCert(cfg)
	if err != nil {
		return err
	}
	m := map[string]any{
		"certid":      certId,
		"domain":      domain,
		"forceHttps":  forceHttps,
		"http2Enable": http2Enable,
	}

	var response commonResponse
	err = requestQiniu(cfg, fmt.Sprintf("domain/%s/httpsconf", domain), m, "PUT", &response)
	return err
}

func DeployQiniuOss(cfg map[string]any) error {
	_, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	domain, ok := cfg["domain"].(string)
	if !ok {
		return fmt.Errorf("参数错误：domain")
	}

	// 判断域名是否已开启HTTPS
	// {
	//		"certId": <CertID>,
	//		"forceHttps": <ForceHttps>,
	//		"http2Enable": <Http2Enable>
	//	}
	var httpsConfig struct {
		Https struct {
			CertID      string `json:"certId"`
			ForceHttps  bool   `json:"forceHttps"`
			Http2Enable bool   `json:"http2Enable"`
		} `json:"https"`
	}
	err := requestQiniu(cfg, fmt.Sprintf("domain/%s", domain), nil, "GET", &httpsConfig)
	if err != nil {
		return fmt.Errorf("获取域名HTTPS配置失败: %v", err)
	}

	certId, err := uploadQiniuCert(cfg)
	if err != nil {
		return err
	}

	if httpsConfig.Https.CertID != "" {
		// 如果已开启HTTPS，则调用updateQiniuDomainCert更新证书
		cfg["cert_id"] = certId
		cfg["force_https"] = httpsConfig.Https.ForceHttps
		cfg["http2_enable"] = httpsConfig.Https.Http2Enable
		err = updateQiniuDomainCert(cfg)
		return err
	} else {
		// 如果未开启HTTPS，则使用POST请求绑定证书
		m := map[string]any{
			"certid": certId,
			"domain": domain,
		}
		var response commonResponse
		err = requestQiniu(cfg, "cert/bind", m, "POST", &response)
		return err
	}
}

func delQiniuCert(cfg map[string]any) error {
	certId, ok := cfg["old_cert_id"].(string)
	if !ok {
		return fmt.Errorf("参数错误：cert_id")
	}
	m := map[string]any{}
	var response commonResponse
	err := requestQiniu(cfg, fmt.Sprintf("sslcert/%v", certId), m, "DELETE", &response)
	return err
}

func uploadQiniuCert(cfg map[string]any) (string, error) {
	cert, ok := cfg["certificate"].(map[string]any)
	keyPem, ok := cert["key"].(string)
	if !ok {
		return "", fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return "", fmt.Errorf("证书错误：cert")
	}
	m := map[string]any{
		"pri": keyPem,
		"ca":  certPem,
	}
	var response sslCertResponse
	err := requestQiniu(cfg, "sslcert", m, "POST", &response)
	return response.CertID, err
}

func QiniuAPITest(providerID string) error {
	cfg := map[string]any{
		"provider_id": providerID,
	}
	m := map[string]any{}
	var response commonResponse
	err := requestQiniu(cfg, "sslcert", m, "GET", &response)
	if err != nil {
		return fmt.Errorf("测试请求失败: %v", err)
	}
	return nil
}
