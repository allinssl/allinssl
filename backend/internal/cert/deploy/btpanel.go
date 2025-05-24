package deploy

import (
	"ALLinSSL/backend/internal/access"
	"crypto/md5"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

func generateSignature(timestamp, apiKey string) string {
	keyMd5 := md5.Sum([]byte(apiKey))
	keyMd5Hex := strings.ToLower(hex.EncodeToString(keyMd5[:]))

	signMd5 := md5.Sum([]byte(timestamp + keyMd5Hex))
	signMd5Hex := strings.ToLower(hex.EncodeToString(signMd5[:]))
	return signMd5Hex
}

func RequestBt(data *url.Values, method, providerID, requestUrl string) (map[string]any, error) {
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
	timestamp := time.Now().Unix()
	token := generateSignature(fmt.Sprintf("%d", timestamp), providerConfig["api_key"])

	data.Set("request_time", fmt.Sprintf("%d", timestamp))
	data.Set("request_token", token)

	parsedURL, err := url.Parse(providerConfig["url"])
	if err != nil {
		return nil, err
	}
	baseURL := fmt.Sprintf("%s://%s/", parsedURL.Scheme, parsedURL.Host)

	req, err := http.NewRequest(method, baseURL+requestUrl, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36")
	// 自定义 Transport，跳过 SSL 证书验证
	ignoreSsl := false
	if providerConfig["ignore_ssl"] == "1" {
		ignoreSsl = true
	}
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: ignoreSsl},
	}

	client := &http.Client{Transport: tr}
	resp, err := client.Do(req)
	if err != nil {
		// fmt.Println(err)
		return nil, fmt.Errorf("请求BT失败: %v", err)
	}
	body, _ := io.ReadAll(resp.Body)
	defer resp.Body.Close()

	var res map[string]interface{}
	err = json.Unmarshal(body, &res)
	if err != nil {
		return nil, fmt.Errorf("返回值解析失败: %v，%s", err, string(body))
	}

	if res["status"] != nil && !res["status"].(bool) {
		return nil, fmt.Errorf("请求出错: %s", res["msg"].(string))
	}
	return res, nil
}

func UploadBt(key, csr, providerID string) (string, error) {
	data := url.Values{}
	data.Set("key", key)
	data.Set("csr", csr)
	response, err := RequestBt(&data, "POST", providerID, "ssl/cert/save_cert")
	if response == nil {
		return "", fmt.Errorf("证书上传失败: %v", err)
	}
	sslHash := response["ssl_hash"].(string)
	
	return sslHash, nil
}

func DeployBt(cfg map[string]any) error {
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	// 设置证书
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
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
	data := url.Values{}
	data.Set("cert_type", "1")
	data.Set("privateKey", keyPem)
	data.Set("certPem", certPem)
	_, err := RequestBt(&data, "POST", providerID, "config?action=SetPanelSSL")
	if err != nil {
		return fmt.Errorf("证书部署失败: %v", err)
	}
	return nil
}

func DeployBtSite(cfg map[string]any) error {
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	// 设置证书
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
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
	siteNames, ok := cfg["siteName"].(string)
	if !ok {
		return fmt.Errorf("参数错误：siteName")
	}
	
	sslHash, err := UploadBt(keyPem, certPem, providerID)
	batchInfo := []map[string]string{}
	
	siteNamesList := strings.Split(siteNames, ",")
	for _, siteName := range siteNamesList {
		batchInfo = append(batchInfo, map[string]string{
			"siteName": siteName,
			"ssl_hash": sslHash,
		})
	}
	batchs, err := json.Marshal(batchInfo)
	
	data := url.Values{}
	data.Set("BatchInfo", string(batchs))
	_, err = RequestBt(&data, "POST", providerID, "ssl?action=SetBatchCertToSite")
	if err != nil {
		return fmt.Errorf("证书部署失败: %v", err)
	}
	return nil
}

func DeployBtDockerSite(cfg map[string]any) error {
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	// 设置证书
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
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
	siteName, ok := cfg["siteName"].(string)
	if !ok {
		return fmt.Errorf("参数错误：siteName")
	}
	data := url.Values{}
	data.Set("key", keyPem)
	data.Set("csr", certPem)
	data.Set("siteName", siteName)
	_, err := RequestBt(&data, "POST", providerID, "mod/docker/com/set_ssl")
	if err != nil {
		return fmt.Errorf("证书部署失败: %v", err)
	}
	return nil
}

func BtPanelAPITest(providerID string) error {
	data := url.Values{}
	_, err := RequestBt(&data, "POST", providerID, "system?action=GetNetWork")
	if err != nil {
		return fmt.Errorf("测试请求失败: %v", err)
	}
	return nil
}

func BtPanelSiteList(providerID string) ([]any, error) {
	data := url.Values{}
	data.Set("cert_list", "")
	siteList, err := RequestBt(&data, "POST", providerID, "ssl?action=GetSiteDomain")
	if err != nil {
		fmt.Println("获取网站列表失败:", err)
		return nil, err
	}
	
	fmt.Printf("siteList:%#v\n", siteList["all"].([]any))
	return siteList["all"].([]any), nil
}