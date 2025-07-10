package lecdn

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/public"
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
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
			TLSClientConfig: &tls.Config{InsecureSkipVerify: ignoreSsl},
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
	if len(list) == 0 {
		return nil, fmt.Errorf("未找到任何证书")
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

// UploadCert 上传证书到 LeCDN
func (l *LecdnConfig) UploadCert(cert, key, name string) (int, error) {
	url := fmt.Sprintf("%s/prod-api/certificate", l.BaseURL)
	keyBase64 := base64.StdEncoding.EncodeToString([]byte(key))
	certBase64 := base64.StdEncoding.EncodeToString([]byte(cert))

	params := map[string]any{
		"ssl_key":      keyBase64,
		"ssl_pem":      certBase64,
		"type":         "upload",
		"auto_renewal": false,
		"name":         name,
	}
	resp, err := requestLecdn(url, "POST", l.Token, params, l.IgnoreSSL)
	if err != nil {
		return 0, fmt.Errorf("上传证书失败: %v", err)
	}
	data, ok := resp["data"].(map[string]any)
	if !ok {
		return 0, fmt.Errorf("上传证书响应格式错误: %v", resp)
	}
	id, ok := data["id"].(float64)
	if !ok {
		return 0, fmt.Errorf("上传证书响应中未找到 id: %v", resp)
	}
	return int(id), nil
}

// GetDomainIdMapFromSite 获取指定站点的域名列表，并返回域名到 ID 的映射
func (l *LecdnConfig) GetDomainIdMapFromSite(siteId int) (map[string]int, error) {
	url := fmt.Sprintf("%s/prod-api/site/%d/domain_name", l.BaseURL, siteId)
	resp, err := requestLecdn(url, "GET", l.Token, nil, l.IgnoreSSL)
	if err != nil {
		return nil, fmt.Errorf("获取域名列表失败: %v", err)
	}
	data, ok := resp["data"].([]any)
	if !ok {
		return nil, fmt.Errorf("获取域名列表响应格式错误: %v", resp)
	}
	domains := make(map[string]int)
	for _, domain := range data {
		domainData, ok := domain.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("域名列表项格式错误: %v", domain)
		}
		domainName, ok := domainData["domain_name"].(string)
		if !ok {
			return nil, fmt.Errorf("域名列表项中未找到 domain_name: %v", domainData)
		}
		id, ok := domainData["id"].(float64)
		if !ok {
			return nil, fmt.Errorf("域名列表项中未找到 id: %v", domainData)
		}
		domains[domainName] = int(id)
	}
	return domains, nil
}

// DeployCert 部署证书到指定站点的域名
func (l *LecdnConfig) DeployCert(siteId, domainId, certId int) error {
	url := fmt.Sprintf("%s/prod-api/site/%d/domain_name/certificate", l.BaseURL, siteId)
	params := map[string]any{"certificate_enable": true, "certificate_id": certId, "domain_name_id": domainId}
	_, err := requestLecdn(url, "PUT", l.Token, params, l.IgnoreSSL)
	if err != nil {
		return fmt.Errorf("部署证书失败: %v", err)
	}
	return nil
}

// DeployLeCDN 部署 LeCDN 证书主方法
func DeployLeCDN(cfg map[string]any) error {
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
	certName, err := public.GetSHA256(certPem)
	if err != nil {
		return fmt.Errorf("获取证书名称失败: %v", err)
	}
	certName = "ALLinSSL-" + certName
	var providerID string
	switch v := cfg["provider_id"].(type) {
	case float64:
		providerID = strconv.Itoa(int(v))
	case string:
		providerID = v
	default:
		return fmt.Errorf("参数错误：provider_id")
	}
	domainName, ok := cfg["domain_name"].(string)
	if !ok || domainName == "" {
		return fmt.Errorf("参数错误：domain_name")
	}
	var siteId int
	switch v := cfg["site_id"].(type) {
	case float64:
		siteId = int(v)
	case string:
		siteId, err = strconv.Atoi(v)
		if err != nil {
			return fmt.Errorf("参数错误：site_id")
		}
	case int:
		siteId = v
	default:
		return fmt.Errorf("参数错误：site_id")
	}

	l, err := NewLecdnConfig(providerID)
	if err != nil {
		return err
	}
	err = l.client()
	if err != nil {
		return fmt.Errorf("登录 LeCDN 失败: %v", err)
	}

	certId := 0
	// 获取证书列表
	certList, err := l.GetCertList()
	if err == nil && len(certList) > 0 {
		for _, c := range certList {
			name, ok := c["name"].(string)
			if !ok {
				continue
			}
			id, ok := c["id"].(float64)
			if !ok {
				continue
			}
			if name == certName {
				certId = int(id)
			}
		}
	}
	if certId == 0 {
		// 上传证书
		certId, err = l.UploadCert(certPem, keyPem, certName)
		if err != nil {
			return fmt.Errorf("上传证书失败: %v", err)
		}
	}
	// 获取域名列表
	domainList, err := l.GetDomainIdMapFromSite(siteId)
	if err != nil {
		return fmt.Errorf("获取域名列表失败: %v", err)
	}
	domainId, ok := domainList[domainName]
	if !ok {
		return fmt.Errorf("未找到域名 %s 的 ID", domainName)
	}
	// 部署证书到域名
	err = l.DeployCert(siteId, domainId, certId)
	if err != nil {
		return fmt.Errorf("部署证书到域名失败: %v", err)
	}
	// 部署完成，返回成功
	return nil
}
