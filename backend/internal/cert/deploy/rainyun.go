package deploy

import (
	"ALLinSSL/backend/internal/access"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/tidwall/gjson"
)

var rainyunApi = "https://api.v2.rainyun.com"
var httpClient = &http.Client{}

func RainyunApiTest(providerID string) error {
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

	resp, err := requestRainyunApi("/user/", providerConfig["api_key"], http.MethodGet, nil)
	if err != nil {
		return err
	}

	if gjson.Get(resp, "code").Int() != 200 {
		return errors.New(gjson.Get(resp, "message").String())
	}
	return nil
}

func DeployRainyunSSLCenter(cfg map[string]any) error {
	// 获取证书
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}

	// 获取ApiKey
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
	if err != nil {
		return err
	}
	providerConfigStr, _ := providerData["config"].(string)
	var providerConfig map[string]string
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return err
	}
	apiKey := providerConfig["api_key"]

	// 校验参数
	certId, ok := cfg["cert_id"].(string)
	if !ok {
		return fmt.Errorf("参数错误：cert_id")
	}
	_, ok = cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	_, ok = cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
	}

	// 更新证书中心
	reqPath := fmt.Sprintf("/product/sslcenter/%s", certId)
	resp, err := requestRainyunApi(reqPath, apiKey, http.MethodPost, cert)
	if err != nil {
		return err
	}
	if gjson.Get(resp, "code").Int() != 200 {
		return errors.New(gjson.Get(resp, "message").String())
	}

	return nil
}

func requestRainyunApi(path, apikey, method string, data interface{}) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	reqBody, err := json.Marshal(data)
	if err != nil || data == nil {
		reqBody = nil
	}
	req, err := http.NewRequestWithContext(ctx, method, rainyunApi+path, bytes.NewBuffer(reqBody))
	if err != nil {
		return "", fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("X-Api-Key", apikey)

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("http get error: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 50*1024*1024))
	if err != nil {
		return "", fmt.Errorf("read body: %w", err)
	}

	return string(body), nil
}
