package deploy

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/public"
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
)

func RequestSafeLineWaf(data *map[string]any, method, providerID, requestUrl string) (map[string]any, error) {
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

	req.Header.Set("X-SLCE-API-TOKEN", providerConfig["api_token"])
	req.Header.Set("Content-Type", "application/json")
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
		return nil, fmt.Errorf("请求雷池WAF失败: %v", err)
	}
	body, _ := io.ReadAll(resp.Body)
	defer resp.Body.Close()
	var res map[string]interface{}
	err = json.Unmarshal(body, &res)
	if err != nil {
		return nil, fmt.Errorf("返回值解析失败: %v", err)
	}
	if res["msg"].(string) != "" {
		return nil, fmt.Errorf("请求出错: %s", res["msg"].(string))
	}
	return res, nil
}

func GetSafeLineWafSiteList(page int, pageSize int, siteName string, providerId string) ([]any, error) {
	requestUrl := fmt.Sprintf("api/open/site?page=%d&page_size=%d&site=%s", page, pageSize, siteName)
	response, err := RequestSafeLineWaf(&map[string]any{}, "GET", providerId, requestUrl)
	if err != nil {
		return nil, err
	}
	res := response["data"].(map[string]any)
	return res["data"].([]any), nil
}

func matchSafeLineSiteByColumn(siteList []any, column string, keyword string) (siteInfo map[string]any) {
	for _, site := range siteList {
		sInfo := site.(map[string]any)
		if keyword == sInfo[column] {
			siteInfo = sInfo
		}
	}
	return siteInfo
}

// 上传证书 certId="" 新上传证书 否则覆盖证书
func uploadSafeLineCert(certId float64, key, cert, providerId string) (id float64, err error) {
	data := map[string]any{
		"type": 2,
		"manual": map[string]any{
			"crt": cert,
			"key": key,
		},
	}
	if certId != 0 {
		data["id"] = certId
	}
	response, err := RequestSafeLineWaf(&data, "POST", providerId, "api/open/cert")
	if err != nil {
		return 0, err
	}
	return response["data"].(float64), nil
}

func DeploySafeLineWaf(cfg map[string]any) error {
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

	certId, err := uploadSafeLineCert(0, keyPem, certPem, providerID)
	data := map[string]any{
		"cert_id": certId,
	}
	_, err = RequestSafeLineWaf(&data, "PUT", providerID, "api/open/system")

	if err != nil {
		return fmt.Errorf("证书部署失败: %v", err)
	}
	return nil
}

func DeploySafeLineWafSite(cfg map[string]any, logger *public.Logger) error {
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

	siteList, err := GetSafeLineWafSiteList(1, 100, "测", "5")
	if siteList == nil || err != nil {
		return fmt.Errorf("雷池WAF找不到网站名称：%s", siteName)
	}
	//通过应用名名匹配
	siteInfo := matchSafeLineSiteByColumn(siteList, "comment", siteName)
	if siteInfo == nil {
		return fmt.Errorf("雷池WAF 找不到应用名称：%s", siteName)
	}
	//siteId := siteInfo["id"]
	certId := siteInfo["cert_id"].(float64)
	if certId == 0 {
		//未部署证书
		logger.Debug(fmt.Sprintf("网站%s未启用SSL,上传证书中...", siteName))
		certId, err := uploadSafeLineCert(0, keyPem, certPem, providerID)
		if err != nil {
			return fmt.Errorf("网站%s上传证书失败...：%s", siteName, err.Error())
		}
		logger.Debug(fmt.Sprintf("网站%s上传成功 证书ID：%d 请手动添加至网站中", siteName, int(certId)))
	} else {
		//已部署证书
		logger.Debug(fmt.Sprintf("网站已启用SSL 证书ID：%d 更新证书中...", int(certId)))
		_, err := uploadSafeLineCert(certId, keyPem, certPem, providerID)
		if err != nil {
			return fmt.Errorf("网站%s证书更新成功...：%s", siteName, err.Error())
		}
	}

	return nil
}
