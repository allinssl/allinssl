package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type LoginInfo struct {
	account  string
	password string
}
type LoginResponse struct {
	Code    string
	Message string
	Data    string
	Success bool
}

type HTTPSConfig struct {
	HTTPSStatus       string `json:"https_status"`
	CertificateSource string `json:"certificate_source"`
	CertificateName   string `json:"certificate_name"`
	CertificateValue  string `json:"certificate_value"`
	PrivateKey        string `json:"private_key"`
}

type DeployConfig struct {
	DomainID string      `json:"doMainId"`
	HTTPS    HTTPSConfig `json:"https"`
}

func randomString(n int) string {
	rand.Seed(time.Now().UnixNano())
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

const baseUrl = "https://www.kuocaiyun.com/"

func login(loginInfo LoginInfo) (string, error) {
	loginUrl := baseUrl + "login/loginUser"
	formData := url.Values{}
	formData.Set("userAccount", loginInfo.account)
	formData.Set("userPwd", loginInfo.password)
	formData.Set("remember", "true")
	resp, err := http.Post(loginUrl, "application/x-www-form-urlencoded", strings.NewReader(formData.Encode()))
	const emptyString = ""
	if err != nil {
		outputError("请求失败", err)
		return emptyString, err
	}
	if resp.StatusCode != 200 {
		return emptyString, errors.New("请求失败：" + string(rune(resp.StatusCode)))
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			outputError("关闭响应流失败", err)
		}
	}(resp.Body)
	// 读取响应体
	var loginResp LoginResponse
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		outputError("解析登录请求结果失败", err)
		return emptyString, err
	}
	if !loginResp.Success || loginResp.Data == "" {
		return emptyString, errors.New("登录请求失败：" + loginResp.Message)
	}
	return loginResp.Data, nil
}

func deployCert(token string, domainId string, certKey string, certValue string) (map[string]interface{}, error) {
	deployUrl := baseUrl + "CdnDomainHttps/httpsConfiguration"
	params := DeployConfig{
		DomainID: domainId,
		HTTPS: HTTPSConfig{
			HTTPSStatus:       "on",
			CertificateSource: "0",
			CertificateName:   "cert_" + randomString(13),
			CertificateValue:  certValue,
			PrivateKey:        certKey,
		},
	}
	// 序列化参数
	jsonData, err := json.Marshal(params)
	if err != nil {
		return nil, fmt.Errorf("JSON序列化失败: %v", err)
	}

	req, err := http.NewRequest("POST", deployUrl, strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Cookie", "kuocai_cdn_token="+token)

	client := &http.Client{}
	resp, err := client.Do(req)

	if err != nil {
		return nil, fmt.Errorf("HTTP请求失败: %v", err)
	}
	defer resp.Body.Close()

	// 解析响应
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("响应解析失败: %v", err)
	}
	if !result["success"].(bool) {
		return result, fmt.Errorf("更新证书失败")
	}
	return result, nil
}

func Upload(cfg map[string]any) (*Response, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config cannot be nil")
	}
	certStr, ok := cfg["cert"].(string)
	if !ok || certStr == "" {
		return nil, fmt.Errorf("cert is required and must be a string")
	}
	keyStr, ok := cfg["key"].(string)
	if !ok || keyStr == "" {
		return nil, fmt.Errorf("key is required and must be a string")
	}
	username, ok := cfg["username"].(string)
	if !ok || username == "" {
		return nil, fmt.Errorf("username is required and must be a string")
	}
	password, ok := cfg["password"].(string)
	if !ok || password == "" {
		return nil, fmt.Errorf("password is required and must be a string")
	}
	domainId, ok := cfg["domainId"].(string)
	if !ok || domainId == "" {
		return nil, fmt.Errorf("domainId is required and must be a string")
	}
	token, err := login(LoginInfo{account: username, password: password})
	if err != nil || token == "" {
		return nil, fmt.Errorf("fetch token failed, err %v", err)
	}
	res, err := deployCert(token, domainId, keyStr, certStr)
	if err != nil {
		return nil, err
	}
	return &Response{
		Status:  "success",
		Message: "success",
		Result:  res,
	}, nil
}
