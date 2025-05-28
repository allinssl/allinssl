package report

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type FeishuReport struct {
	webHookUrl string
	secret     string
}

func NewFeishuReport(webHookUrl, secret string) *FeishuReport {
	return &FeishuReport{webHookUrl: webHookUrl, secret: secret}
}

func (f *FeishuReport) sign(params *map[string]any) error {
	timestamp := time.Now().Unix()
	stringToSign := fmt.Sprintf("%v", timestamp) + "\n" + f.secret
	var data []byte
	h := hmac.New(sha256.New, []byte(stringToSign))
	_, err := h.Write(data)
	if err != nil {
		return fmt.Errorf("生成签名失败: %v", err)
	}
	signature := base64.StdEncoding.EncodeToString(h.Sum(nil))
	(*params)["timestamp"] = timestamp
	(*params)["sign"] = signature
	return nil
}

func (f *FeishuReport) SendText(msg string) error {
	data := map[string]any{
		"timestamp": 0,
		"content": map[string]any{
			"text": msg,
		},
		"msg_type": "text",
		"sign":     "",
	}
	if err := f.sign(&data); err != nil {
		return err
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	
	req, err := http.NewRequest("POST", f.webHookUrl, bytes.NewReader(jsonData))
	if err != nil {
		return fmt.Errorf("创建请求失败: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("请求飞书失败: %v", err)
	}
	body, _ := io.ReadAll(resp.Body)
	defer resp.Body.Close()
	var res map[string]interface{}
	err = json.Unmarshal(body, &res)
	if err != nil {
		return fmt.Errorf("返回值解析失败: %v", err)
	}
	
	if res["code"].(float64) != 0 {
		return fmt.Errorf("发送失败: %s", res["msg"].(string))
	}
	return nil
}

func NotifyFeishu(params map[string]any) error {
	if params == nil {
		return fmt.Errorf("缺少参数")
	}
	providerID := params["provider_id"].(string)
	
	providerData, err := GetReport(providerID)
	if err != nil {
		return err
	}
	configStr := providerData["config"].(string)
	var config map[string]string
	err = json.Unmarshal([]byte(configStr), &config)
	if err != nil {
		return fmt.Errorf("解析配置失败: %v", err)
	}
	notifyMsg := fmt.Sprintf("%s : %s", params["subject"].(string), params["body"].(string))
	
	report := NewFeishuReport(config["webhook"], config["secret"])
	err = report.SendText(notifyMsg)
	if err != nil {
		return fmt.Errorf("飞书发送失败: %w", err)
	}
	return nil
}
