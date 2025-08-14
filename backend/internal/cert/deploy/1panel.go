package deploy

import (
	"ALLinSSL/backend/app/dto/response"
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

func generateToken(timestamp string, apiKey string) string {
	tokenMd5 := md5.Sum([]byte("1panel" + apiKey + timestamp))
	tokenMd5Hex := hex.EncodeToString(tokenMd5[:])
	return tokenMd5Hex
}

// method provider_id url data

func Request1panel(data *map[string]any, method, providerID, requestUrl string) (map[string]any, error) {
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
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	token := generateToken(timestamp, providerConfig["api_key"])

	// data, requestUrl, method := GetDeploy1PBody(cfg, Type)
	if requestUrl == "" || data == nil {
		return nil, fmt.Errorf("不支持的部署类型")
	}
	if requestUrl[0] == '/' {
		requestUrl = requestUrl[1:]
	}
	version := providerConfig["version"]
	switch version {
	case "", "1", "v1":
		requestUrl = "api/v1/" + requestUrl
	case "2", "v2":
		(*data)["ssl"] = "Enable"
		if strings.Split(requestUrl, "/")[0] == "settings" {
			requestUrl = "core/" + requestUrl
		}
		requestUrl = "api/v2/" + requestUrl
	default:
		return nil, fmt.Errorf("不支持的1Panel版本: %s", version)
	}

	// 编码为 JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	parsedURL, err := url.Parse(providerConfig["url"])
	if err != nil {
		return nil, err
	}
	baseURL := fmt.Sprintf("%s://%s/", parsedURL.Scheme, parsedURL.Host)
	req, err := http.NewRequest(method, baseURL+requestUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		// fmt.Println(err)
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36")
	req.Header.Set("1Panel-Timestamp", timestamp)
	req.Header.Set("1Panel-Token", token)

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
		return nil, fmt.Errorf("请求1panel失败: %v", err)
	}
	body, _ := io.ReadAll(resp.Body)
	defer resp.Body.Close()

	var res map[string]interface{}
	err = json.Unmarshal(body, &res)
	if err != nil {
		return nil, fmt.Errorf("解析返回值失败: %v", err)
	}
	code, ok := res["code"].(float64)
	if !ok {
		return nil, fmt.Errorf("请求失败")
	}
	if code != 200 {
		msg, ok := res["message"].(string)
		if !ok {
			return nil, fmt.Errorf("请求失败")
		}
		return nil, fmt.Errorf("请求失败: %s", msg)
	}
	return res, nil

}

func Deploy1panel(cfg map[string]any) error {
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
	// 设置证书
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
	}

	data := map[string]interface{}{
		"cert":    certPem,
		"key":     keyPem,
		"ssl":     "enable",
		"sslType": "import-paste",
	}
	_, err := Request1panel(&data, "POST", providerID, "settings/ssl/update")
	if err != nil {
		return fmt.Errorf("证书部署失败: %v", err)
	}
	return nil
}

func Deploy1panelSite(cfg map[string]any) error {
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
	siteId, ok := cfg["site_id"].(string)
	if !ok {
		return fmt.Errorf("参数错误：site_id")
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
	// 获取网站参数
	siteData, err := Request1panel(&map[string]any{}, "GET", providerID, fmt.Sprintf("websites/%s/https", siteId))
	if err != nil {
		return fmt.Errorf("获取网站参数失败: %v", err)
	}
	//
	websiteId, err := strconv.Atoi(siteId)
	if err != nil {
		return fmt.Errorf("获取网站参数失败: %v", err)
	}

	siteData, ok = siteData["data"].(map[string]any)
	if !ok {
		return fmt.Errorf("获取网站参数失败: data")
	}

	var SSLProtocol []any
	if siteData["SSLProtocol"] == nil {
		SSLProtocol = []any{"TLSv1.3", "TLSv1.2", "TLSv1.1", "TLSv1"}
	} else {
		SSLProtocol, ok = siteData["SSLProtocol"].([]any)
		if !ok {
			return fmt.Errorf("获取网站参数失败: data.SSLProtocol")
		}
	}
	algorithm, ok := siteData["algorithm"].(string)
	if !ok {
		return fmt.Errorf("获取网站参数失败: data.algorithm")
	}
	hsts, ok := siteData["hsts"].(bool)
	if !ok {
		return fmt.Errorf("获取网站参数失败: data.hsts")
	}
	httpConfig, ok := siteData["httpConfig"].(string)
	if !ok {
		return fmt.Errorf("获取网站参数失败: data.httpConfig")
	}
	if httpConfig == "" {
		httpConfig = "HTTPToHTTPS"
	}

	data := map[string]any{
		"SSLProtocol": SSLProtocol,
		// "acmeAccountId":   siteData["SSL"].(map[string]any)["acmeAccountId"].(float64),
		"algorithm":   algorithm,
		"certificate": certPem,
		"privateKey":  keyPem,
		// "certificatePath": "",
		// "privateKeyPath":  "",
		"enable":     true,
		"hsts":       hsts,
		"httpConfig": httpConfig,
		"importType": "paste",
		"type":       "manual",
		"websiteId":  websiteId,
	}
	_, err = Request1panel(&data, "POST", providerID, fmt.Sprintf("websites/%s/https", siteId))
	return err
}

func OnePanelAPITest(providerID string) error {
	data := map[string]interface{}{}
	_, err := Request1panel(&data, "GET", providerID, "settings/upgrade")
	if err != nil {
		return fmt.Errorf("测试请求失败: %v", err)
	}
	return nil
}

func OnePanelSiteList(providerID string) ([]response.AccessSiteList, error) {
	data := map[string]any{
		"name":           "",
		"order":          "null",
		"orderBy":        "created_at",
		"page":           1,
		"pageSize":       1000,
		"websiteGroupId": 0,
	}
	siteList, err := Request1panel(&data, "POST", providerID, "websites/search")
	if err != nil {
		return nil, fmt.Errorf("获取网站列表失败 %v", err)
	}

	var result []response.AccessSiteList
	sites, ok := siteList["data"].(map[string]any)["items"].([]any)
	if !ok {
		return nil, fmt.Errorf("获取网站列表失败: data.items")
	}

	for _, site := range sites {
		siteMap, ok := site.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("获取网站列表失败: site")
		}
		siteId := strconv.FormatFloat(siteMap["id"].(float64), 'f', -1, 64)
		result = append(result, response.AccessSiteList{Id: siteId, SiteName: siteMap["alias"].(string), Domain: []string{}})
	}

	return result, nil
}
