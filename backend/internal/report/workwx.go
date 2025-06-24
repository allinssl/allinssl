package report

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

func PostHeader(url string, msg []byte, headers map[string]string) (string, error) {
	client := &http.Client{}

	req, err := http.NewRequest("POST", url, strings.NewReader(string(msg)))
	if err != nil {
		return "", err
	}
	for key, header := range headers {
		req.Header.Set(key, header)
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(body), nil
}

func PostJson(url string, msg []byte) (string, error) {
	headers := make(map[string]string)
	headers["Content-Type"] = "application/json;charset=utf-8"
	res, err := PostHeader(url, msg, headers)
	return res, err
}

func NotifyWorkWx(params map[string]any) error {
	if params == nil {
		return fmt.Errorf("缺少参数")
	}
	providerID := params["provider_id"].(string)
	// fmt.Println(providerID)
	providerData, err := GetReport(providerID)
	if err != nil {
		return err
	}
	configStr := providerData["config"].(string)
	//fmt.Println(configStr)
	var config map[string]string
	err = json.Unmarshal([]byte(configStr), &config)
	if err != nil {
		return fmt.Errorf("解析配置失败: %v", err)
	}
	url := config["url"]
	if url == "" {
		return fmt.Errorf("缺少企业微信URL配置")
	}
	if config["data"] == "" {
		config["data"] = `
{
    "msgtype": "news",
    "news": {
       "articles" : [
           {
               "title" : "__subject__",
               "description" : "__body__。",
               "url" : "https://allinssl.com/",
               "picurl" : "https://allinssl.com/logo.svg"
           }
        ]
    }
}
`
	}
	msg, err := ReplaceJSONPlaceholders(config["data"], params)
	if err != nil {
		return fmt.Errorf("替换JSON占位符失败: %v", err)
	}
	_, err = PostJson(url, []byte(msg))
	if err != nil {
		return fmt.Errorf("发送企业微信消息失败: %v", err)
	}
	return nil
}
