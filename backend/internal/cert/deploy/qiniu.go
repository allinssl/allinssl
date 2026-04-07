package deploy

import (
	"ALLinSSL/backend/internal/access"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/qiniu/go-sdk/v7/auth"
	"github.com/qiniu/go-sdk/v7/client"
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
	deployed := 0
	for _, d := range strings.Split(domain, ",") {
		d = strings.TrimSpace(d)
		if d == "" {
			continue
		}
		path := fmt.Sprintf("domain/%v/sslize", d)
		m := map[string]any{
			"certid": certId,
		}
		var response commonResponse
		if err = requestQiniu(cfg, path, m, "PUT", &response); err != nil {
			return err
		}
		deployed++
	}
	if deployed == 0 {
		return fmt.Errorf("参数错误：domain")
	}
	return nil
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

	certId, err := uploadQiniuCert(cfg)
	if err != nil {
		return err
	}
	deployed := 0
	for _, d := range strings.Split(domain, ",") {
		d = strings.TrimSpace(d)
		if d == "" {
			continue
		}
		m := map[string]any{
			"certid": certId,
			"domain": d,
		}
		var response commonResponse
		if err = requestQiniu(cfg, "cert/bind", m, "POST", &response); err != nil {
			return err
		}
		deployed++
	}
	if deployed == 0 {
		return fmt.Errorf("参数错误：domain")
	}
	return nil
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