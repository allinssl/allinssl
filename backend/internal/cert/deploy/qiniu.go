package deploy

import (
	"ALLinSSL/backend/internal/access"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/qiniu/go-sdk/v7/auth"
	"github.com/qiniu/go-sdk/v7/client"
)

// DeployQiniuCdn deploys an SSL certificate to a Qiniu CDN domain.
// It takes a configuration map containing certificate data and domain information,
// uploads the certificate to Qiniu's service, and then applies it to the specified domain.
//
// Parameters:
//   - cfg: A map containing:
//   - "certificate": Map with "key" (private key) and "cert" (certificate) strings
//   - "domain": String representing the domain to apply the certificate to
//   - "provider_id": The ID of the Qiniu provider (string or float64)
//
// Returns:
//   - error: nil on success, or an error describing what went wrong
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

type commonResponse struct {
	Code  int    `json:"code"`
	Error string `json:"error"`
}

type sslCertResponse struct {
	CertID string `json:"certID"`
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
