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
	"net/url"
	"time"
)

type DingtalkReport struct {
	webHookUrl string
	secret     string
}

func NewDingtalkReport(webHookUrl, secret string) *DingtalkReport {
	return &DingtalkReport{webHookUrl: webHookUrl, secret: secret}
}

func (d *DingtalkReport) sign() (string, error) {
	timestamp := time.Now().UnixNano() / 1000000
	stringToSign := fmt.Sprintf("%d\n%s", timestamp, d.secret)
	hash := hmac.New(sha256.New, []byte(d.secret))
	hash.Write([]byte(stringToSign))
	sum := hash.Sum(nil)
	signature := base64.StdEncoding.EncodeToString(sum)
	
	webhookurl, _ := url.Parse(d.webHookUrl)
	query := webhookurl.Query()
	query.Set("timestamp", fmt.Sprint(timestamp))
	query.Set("sign", signature)
	webhookurl.RawQuery = query.Encode()
	
	return webhookurl.String(), nil
}

func (d *DingtalkReport) SendText(msg string) error {
	data := map[string]any{
		"text": map[string]any{
			"content": msg,
		},
		"msgtype": "text",
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	
	signUrl, err := d.sign()
	if err != nil {
		return err
	}
	req, _ := http.NewRequest("POST", signUrl, bytes.NewReader(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("请求钉钉失败: %v", err)
	}
	body, _ := io.ReadAll(resp.Body)
	defer resp.Body.Close()
	var res map[string]interface{}
	err = json.Unmarshal(body, &res)
	if err != nil {
		return fmt.Errorf("返回值解析失败: %v", err)
	}
	
	if res["errcode"].(float64) != 0 {
		return fmt.Errorf("发送失败: %s", res["errmsg"].(string))
	}
	return nil
	
}

func NotifyDingtalk(params map[string]any) error {
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
	
	report := NewDingtalkReport(config["webhook"], config["secret"])
	err = report.SendText(notifyMsg)
	if err != nil {
		return fmt.Errorf("Dingtalk发送失败: %w", err)
	}
	return nil
}
