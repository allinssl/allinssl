package lecdn

import (
	"ALLinSSL/backend/internal/access"
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
)

// LecdnConfig 代表 LeCDN 的配置
type LecdnConfig struct {
	BaseURL   string `json:"baseurl"`
	Token     string `json:"token"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	IgnoreSSL bool   `json:"ignore_ssl"`
}

// NewLecdnConfig 创建一个新的 LecdnConfig 实例
func NewLecdnConfig(providerID string) (*LecdnConfig, error) {
	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return nil, err
	}
	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return nil, fmt.Errorf("api配置错误")
	}
	// 解析 JSON 配置
	var providerConfig map[string]string
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return nil, err
	}
	l := &LecdnConfig{
		BaseURL:   providerConfig["url"],
		Username:  providerConfig["username"],
		Password:  providerConfig["password"],
		IgnoreSSL: providerConfig["ignore_ssl"] == "1",
	}
	return l, nil
}

// requestLecdn 发送 HTTP 请求到 LeCDN API
func requestLecdn(url, method, token string, params map[string]any, ignoreSsl bool) (map[string]any, error) {
	var res map[string]any

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig:   &tls.Config{InsecureSkipVerify: ignoreSsl},
			DisableKeepAlives: true,
		},
	}

	jsonData, _ := json.Marshal(params)
	req, err := http.NewRequest(method, url, bytes.NewBuffer(jsonData))
	if err != nil {
		return res, err
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("cookie", "LeCDN-Client="+token)
	}

	resp, err := client.Do(req)
	if err != nil {
		return res, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return res, fmt.Errorf("请求失败，状态码：%d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return res, err
	}
	err = json.Unmarshal(body, &res)
	if err != nil {
		return res, fmt.Errorf("解析响应失败: %v, 响应内容: %s", err, string(body))
	}

	return res, nil
}

// client 登录 LeCDN 并获取 Token
func (l *LecdnConfig) client() error {
	url := fmt.Sprintf("%s/prod-api/login", l.BaseURL)
	resp, err := requestLecdn(url, "POST", "", map[string]any{
		"username": l.Username,
		"password": l.Password,
	}, l.IgnoreSSL)
	if err != nil {
		return fmt.Errorf("登录失败: %v", err)
	}
	data, ok := resp["data"].(map[string]any)
	if !ok {
		return fmt.Errorf("登录响应格式错误: %v", resp)
	}
	token, ok := data["token"].(string)
	if !ok {
		return fmt.Errorf("登录响应中未找到 token: %v", resp)
	}
	l.Token = token
	return nil
}

// GetCertList 获取证书列表
func (l *LecdnConfig) GetCertList() ([]map[string]any, error) {
	url := fmt.Sprintf("%s/prod-api/certificate?current_page=1&total=9999&page_size=9999", l.BaseURL)
	resp, err := requestLecdn(url, "GET", l.Token, nil, l.IgnoreSSL)
	if err != nil {
		return nil, fmt.Errorf("获取证书列表失败: %v", err)
	}
	data, ok := resp["data"].(map[string]any)
	if !ok {
		return nil, fmt.Errorf("获取证书列表响应格式错误: %v", resp)
	}
	list, ok := data["items"].([]any)
	if !ok {
		return nil, fmt.Errorf("获取证书列表响应中未找到 items: %v", resp)
	}
	var certs []map[string]any
	for _, item := range list {
		cert, ok := item.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("证书列表项格式错误: %v", item)
		}
		certs = append(certs, cert)
	}
	return certs, nil
}

// UpdateCert 覆盖更新 LeCDN 上已有证书
func (l *LecdnConfig) UpdateCert(certID int, cert, key string, oldCert map[string]any) error {
	url := fmt.Sprintf("%s/prod-api/certificate/%d", l.BaseURL, certID)
	keyBase64 := base64.StdEncoding.EncodeToString([]byte(key))
	certBase64 := base64.StdEncoding.EncodeToString([]byte(cert))

	params := map[string]any{
		"id":           certID,
		"name":         oldCert["name"],
		"description":  oldCert["description"],
		"type":         oldCert["type"],
		"ssl_key":      keyBase64,
		"ssl_pem":      certBase64,
		"auto_renewal": false,
	}
	_, err := requestLecdn(url, "PUT", l.Token, params, l.IgnoreSSL)
	if err != nil {
		return fmt.Errorf("更新证书失败: %v", err)
	}
	return nil
}

// DeployLeCDN 部署 LeCDN 证书主方法
func DeployLeCDN(cfg map[string]any) error {
	var err error
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
	}
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
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
	l, err := NewLecdnConfig(providerID)
	if err != nil {
		return err
	}
	err = l.client()
	if err != nil {
		return fmt.Errorf("登录 LeCDN 失败: %v", err)
	}

	certList, err := l.GetCertList()
	if err != nil {
		return err
	}
	certMap := make(map[int]map[string]any, len(certList))
	for _, item := range certList {
		idValue, ok := item["id"].(float64)
		if !ok {
			continue
		}
		certMap[int(idValue)] = item
	}

	certIDRaw, ok := cfg["cert_id"]
	if !ok {
		return fmt.Errorf("参数错误：cert_id")
	}
	certIDText := strings.TrimSpace(fmt.Sprintf("%v", certIDRaw))
	if certIDText == "" {
		return fmt.Errorf("参数错误：cert_id")
	}

	for _, rawID := range strings.Split(certIDText, ",") {
		certIDStr := strings.TrimSpace(rawID)
		if certIDStr == "" {
			return fmt.Errorf("参数错误：cert_id")
		}
		certID, parseErr := strconv.Atoi(certIDStr)
		if parseErr != nil || certID <= 0 {
			return fmt.Errorf("参数错误：cert_id")
		}
		oldCert, exists := certMap[certID]
		if !exists {
			return fmt.Errorf("未找到证书ID %d", certID)
		}
		err = l.UpdateCert(certID, certPem, keyPem, oldCert)
		if err != nil {
			return fmt.Errorf("按证书ID更新 LeCDN 证书失败: %v", err)
		}
	}

	return nil
}
