package deploy

import (
	"ALLinSSL/backend/internal/access"
	"bytes"
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

func bfWafToken(timestamp, apiKey string) string {
	keyMd5 := md5.Sum([]byte(apiKey))
	keyMd5Hex := strings.ToLower(hex.EncodeToString(keyMd5[:]))

	signMd5 := md5.Sum([]byte(timestamp + keyMd5Hex))
	signMd5Hex := strings.ToLower(hex.EncodeToString(signMd5[:]))
	return signMd5Hex
}

func RequestBtWaf(data *map[string]any, method, providerID, requestUrl string) (map[string]any, error) {
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

	parsedURL, err := url.Parse(providerConfig["url"])
	if err != nil {
		return nil, err
	}
	baseURL := fmt.Sprintf("%s://%s/", parsedURL.Scheme, parsedURL.Host)

	jsonData, err := json.Marshal(data)
	req, err := http.NewRequest(method, baseURL+requestUrl, bytes.NewReader(jsonData))
	if err != nil {
		return nil, err
	}

	timestamp := time.Now().Unix()
	token := bfWafToken(fmt.Sprintf("%d", timestamp), providerConfig["api_key"])
	req.Header.Set("waf_request_time", fmt.Sprintf("%d", timestamp))
	req.Header.Set("waf_request_token", token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36")
	// 自定义 Transport，跳过 SSL 证书验证
	ignoreSsl := false
	if providerConfig["ignore_ssl"] == "1" {
		ignoreSsl = true
	}
	tr := &http.Transport{
		TLSClientConfig:   &tls.Config{InsecureSkipVerify: ignoreSsl},
		DisableKeepAlives: true,
	}

	client := &http.Client{Transport: tr}
	resp, err := client.Do(req)
	if err != nil {
		// fmt.Println(err)
		return nil, fmt.Errorf("请求BTWAF失败: %v", err)
	}
	body, _ := io.ReadAll(resp.Body)
	defer resp.Body.Close()
	var res map[string]interface{}
	err = json.Unmarshal(body, &res)
	if err != nil {
		return nil, fmt.Errorf("返回值解析失败: %v", err)
	}
	if res["code"] != nil && res["code"].(float64) != 0 {
		return nil, fmt.Errorf("请求出错: %s", res["res"].(string))
	}
	return res, nil
}

func GetBTWafSiteList(page int, pageSize int, siteName string, providerId string) ([]any, error) {
	data := map[string]any{
		"p":         page,
		"p_size":    pageSize,
		"site_name": siteName,
	}
	response, err := RequestBtWaf(&data, "POST", providerId, "api/wafmastersite/get_site_list")
	res := response["res"].(map[string]any)
	if err != nil {
		return nil, err
	}

	return res["list"].([]any), nil
}

// btwaf不支持通过API设置SSL
func DeployBtWaf(cfg map[string]any) error {
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

	data := map[string]any{
		"certContent": certPem,
		"keyContent":  keyPem,
	}
	_, err := RequestBtWaf(&data, "POST", providerID, "api/config/set_cert")
	if err != nil {
		return fmt.Errorf("证书部署失败: %v", err)
	}
	return nil
}

func DeployBtWafSite(cfg map[string]any) error {
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

	siteId := ""
	sitelist, err := GetBTWafSiteList(1, 100, siteName, providerID)
	if len(sitelist) != 0 && err == nil {
		for _, site := range sitelist {
			siteInfo := site.(map[string]any)
			if siteName == siteInfo["site_name"].(string) {
				siteId = siteInfo["site_id"].(string)
			}
		}
	}
	if siteId == "" {
		return fmt.Errorf("宝塔WAF找不到网站名称：%s", siteName)
	}

	data := map[string]any{
		"site_id": siteId,
		"types":   "openCert",
		"server": map[string]any{
			"listen_ssl_port": []string{"443"},
			"ssl": map[string]any{
				"full_chain":  certPem,
				"private_key": keyPem,
				"is_ssl":      1,
			},
		},
	}
	_, err = RequestBtWaf(&data, "POST", providerID, "api/wafmastersite/modify_site")

	if err != nil {
		return fmt.Errorf("证书部署失败: %v", err)
	}
	return nil
}

func BtWafAPITest(providerID string) error {
	data := map[string]any{}
	_, err := RequestBtWaf(&data, "POST", providerID, "api/overview/infos")
	if err != nil {
		return fmt.Errorf("测试请求失败: %v", err)
	}
	return nil
}
