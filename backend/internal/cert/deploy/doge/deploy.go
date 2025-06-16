package doge

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/public"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

type Auth struct {
	AccessKey string `json:"access_key"`
	SecretKey string `json:"secret_key"`
}

func NewAuth(accessKey, secretKey string) *Auth {
	return &Auth{
		AccessKey: accessKey,
		SecretKey: secretKey,
	}
}

func DeployCdn(cfg map[string]any) error {
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

	domain, ok := cfg["domain"].(string)
	if !ok || domain == "" {
		return fmt.Errorf("domain is required and must be a string")
	}
	certStr, ok := cert["cert"].(string)
	if !ok || certStr == "" {
		return fmt.Errorf("cert is required and must be a string")
	}
	keyStr, ok := cert["key"].(string)
	if !ok || keyStr == "" {
		return fmt.Errorf("key is required and must be a string")
	}
	sha256, err := public.GetSHA256(certStr)
	if err != nil {
		return fmt.Errorf("failed to get SHA256 of cert: %w", err)
	}
	note := fmt.Sprintf("allinssl-%s", sha256)

	a := NewAuth(providerConfig["access_key"], providerConfig["secret_key"])
	// 检查证书是否已存在于 CDN
	certList, err := a.listCertFromCdn()
	if err != nil {
		return fmt.Errorf("failed to list certs from CDN: %w", err)
	}
	var certID float64
	for _, cert := range certList {
		if cert["note"] == note {
			certID, ok = cert["id"].(float64)
			if !ok {
				certID = 0
			}
		}
	}
	// 如果证书不存在，则上传证书到 CDN
	if certID == 0 {
		certID, err = a.uploadCertToCdn(certStr, keyStr, note)
		if err != nil || certID == 0 {
			return fmt.Errorf("failed to upload to CDN: %w", err)
		}
	}
	// 绑定证书到域名
	_, err = a.bindCertToCdn(certID, domain)
	if err != nil {
		return fmt.Errorf("failed to bind cert to CDN: %w", err)
	}

	return nil
}

func (a Auth) uploadCertToCdn(cert, key, note string) (float64, error) {
	params := map[string]any{
		"cert":    cert,
		"private": key,
		"note":    note,
	}

	res, err := a.DogeCloudAPI("/cdn/cert/upload.json", params, true)
	if err != nil {
		return 0, fmt.Errorf("failed to call DogeCloud API: %w", err)
	}
	code, ok := res["code"].(float64)
	if !ok {
		return 0, fmt.Errorf("invalid response format: code not found")
	}
	if code != 200 {
		return 0, fmt.Errorf("DogeCloud API error: %s", res["msg"])
	}
	data, ok := res["data"].(map[string]any)
	if !ok {
		return 0, fmt.Errorf("invalid response format: data not found")
	}
	certID, ok := data["id"].(float64)
	if !ok {
		return 0, fmt.Errorf("invalid response format: id not found")
	}
	return certID, nil
}

func (a Auth) listCertFromCdn() ([]map[string]any, error) {
	res, err := a.DogeCloudAPI("/cdn/cert/list.json", map[string]interface{}{}, true)
	if err != nil {
		return nil, fmt.Errorf("failed to call DogeCloud API: %w", err)
	}
	code, ok := res["code"].(float64)
	if !ok {
		return nil, fmt.Errorf("invalid response format: code not found")
	}
	if code != 200 {
		return nil, fmt.Errorf("DogeCloud API error: %s", res["msg"])
	}
	data, ok := res["data"].(map[string]any)
	if !ok {
		return nil, fmt.Errorf("invalid response format: data not found")
	}
	certList, ok := data["certs"].([]any)
	if !ok {
		return nil, fmt.Errorf("invalid response format: certs not found")
	}
	certs := make([]map[string]any, 0, len(certList))
	for _, cert := range certList {
		certMap, ok := cert.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("invalid response format: cert item is not a map")
		}
		certs = append(certs, certMap)
	}
	return certs, nil
}

func (a Auth) bindCertToCdn(certID float64, domain string) (map[string]interface{}, error) {
	params := map[string]interface{}{
		"id":     certID,
		"domain": domain,
	}
	res, err := a.DogeCloudAPI("/cdn/cert/bind.json", params, true)
	if err != nil {
		return nil, fmt.Errorf("failed to call DogeCloud API: %w", err)
	}
	code, ok := res["code"].(float64)
	if !ok {
		return nil, fmt.Errorf("invalid response format: code not found")
	}
	if code != 200 {
		return nil, fmt.Errorf("DogeCloud API error: %s", res["msg"])
	}
	return res, nil

}

// DogeCloudAPI 调用多吉云的 API 根据多吉云官网示例修改
func (a Auth) DogeCloudAPI(apiPath string, data map[string]interface{}, jsonMode bool) (map[string]interface{}, error) {
	AccessKey := a.AccessKey
	SecretKey := a.SecretKey

	body := ""
	mime := ""
	if jsonMode {
		_body, err := json.Marshal(data)
		if err != nil {
			return nil, err
		}
		body = string(_body)
		mime = "application/json"
	} else {
		values := url.Values{}
		for k, v := range data {
			values.Set(k, v.(string))
		}
		body = values.Encode()
		mime = "application/x-www-form-urlencoded"
	}

	signStr := apiPath + "\n" + body
	hmacObj := hmac.New(sha1.New, []byte(SecretKey))
	hmacObj.Write([]byte(signStr))
	sign := hex.EncodeToString(hmacObj.Sum(nil))
	Authorization := "TOKEN " + AccessKey + ":" + sign

	req, err := http.NewRequest("POST", "https://api.dogecloud.com"+apiPath, strings.NewReader(body))
	if err != nil {
		return nil, err // 创建请求错误
	}
	req.Header.Add("Content-Type", mime)
	req.Header.Add("Authorization", Authorization)
	client := http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	} // 网络错误
	defer resp.Body.Close()
	r, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err // 读取响应错误
	}
	var result map[string]interface{}

	err = json.Unmarshal(r, &result)
	if err != nil {
		return nil, err
	}
	return result, nil
}
