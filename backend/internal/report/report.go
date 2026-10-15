package report

import (
	"ALLinSSL/backend/public"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/jordan-wright/email"
	"net/smtp"
	"strings"
	"time"
)

func GetSqlite() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "report"
	return s, nil
}

func GetList(search string, p, limit int64) ([]map[string]any, int, error) {
	var data []map[string]any
	var count int64
	s, err := GetSqlite()
	if err != nil {
		return data, 0, err
	}
	defer s.Close()

	var limits []int64
	if p >= 0 && limit >= 0 {
		limits = []int64{0, limit}
		if p > 1 {
			limits[0] = (p - 1) * limit
			limits[1] = limit
		}
	}

	if search != "" {
		count, err = s.Where("name like ?", []interface{}{"%" + search + "%"}).Count()
		data, err = s.Where("name like ?", []interface{}{"%" + search + "%"}).Limit(limits).Order("update_time", "desc").Select()
	} else {
		count, err = s.Count()
		data, err = s.Order("update_time", "desc").Limit(limits).Select()
	}
	if err != nil {
		return data, 0, err
	}
	return data, int(count), nil
}

func GetReport(id string) (map[string]any, error) {
	s, err := GetSqlite()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	data, err := s.Where("id=?", []interface{}{id}).Select()
	if err != nil {
		return nil, err
	}
	if len(data) == 0 {
		return nil, fmt.Errorf("没有找到此通知配置")
	}
	return data[0], nil

}

func AddReport(Type, config, name string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = s.Insert(map[string]interface{}{
		"name":        name,
		"type":        Type,
		"config":      config,
		"create_time": now,
		"update_time": now,
	})
	return err
}

func UpdReport(id, config, name string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	_, err = s.Where("id=?", []interface{}{id}).Update(map[string]interface{}{
		"name":   name,
		"config": config,
	})
	return err
}

func DelReport(id string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	_, err = s.Where("id=?", []interface{}{id}).Delete()
	return err
}

func NotifyTest(id string) error {
	if id == "" {
		return fmt.Errorf("缺少参数")
	}
	providerData, err := GetReport(id)
	if err != nil {
		return err
	}
	params := map[string]any{
		"provider_id": id,
		"body":        "测试消息通道",
		"subject":     "测试消息通道",
	}
	switch providerData["type"] {
	case "mail":
		err = NotifyMail(params)
	case "webhook":
		err = NotifyWebHook(params)
	case "feishu":
		err = NotifyFeishu(params)
	case "dingtalk":
		err = NotifyDingtalk(params)
	case "workwx":
		err = NotifyWorkWx(params)
	}
	return err
}

func Notify(params map[string]any) error {
	if params == nil {
		return fmt.Errorf("缺少参数")
	}
	providerName, ok := params["provider"].(string)
	if !ok {
		return fmt.Errorf("通知类型错误")
	}
	switch providerName {
	case "mail":
		return NotifyMail(params)
	// case "btpanel-site":
	// 	return NotifyBt(params)
	case "webhook":
		return NotifyWebHook(params)
	case "feishu":
		return NotifyFeishu(params)
	case "dingtalk":
		return NotifyDingtalk(params)
	case "workwx":
		return NotifyWorkWx(params)
	default:
		return fmt.Errorf("不支持的通知类型")
	}
}

// 新监控按账号 ID 发送，旧监控按渠道类型保留原来的首个账号。
func NotifyMonitor(reportTypes, subject, body string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	var notifyErrors []error
	sent := make(map[int64]bool)
	for _, account := range strings.Split(reportTypes, ",") {
		if account == "" {
			continue
		}
		data, err := s.Where("id=? OR type=?", []any{account, account}).Order("id", "asc").Limit([]int64{0, 1}).Select()
		if err != nil {
			notifyErrors = append(notifyErrors, err)
			continue
		}
		if len(data) == 0 {
			notifyErrors = append(notifyErrors, fmt.Errorf("没有找到通知账号：%s", account))
			continue
		}
		provider := data[0]
		id := provider["id"].(int64)
		if sent[id] {
			continue
		}
		sent[id] = true
		var config struct {
			Enabled string `json:"enabled"`
		}
		if err := json.Unmarshal([]byte(provider["config"].(string)), &config); err != nil {
			notifyErrors = append(notifyErrors, fmt.Errorf("解析通知账号 %s 配置失败：%w", provider["name"], err))
			continue
		}
		if config.Enabled == "0" {
			continue
		}
		err = Notify(map[string]any{
			"provider": provider["type"], "provider_id": fmt.Sprint(id),
			"subject": subject, "body": body,
		})
		if err != nil {
			notifyErrors = append(notifyErrors, fmt.Errorf("通知账号 %s 发送失败：%w", provider["name"], err))
		}
	}
	return errors.Join(notifyErrors...)
}

func NotifyMail(params map[string]any) error {

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
	var config struct {
		Sender   string `json:"sender"`
		Receiver string `json:"receiver"`
		Password string `json:"password"`
		SMTPHost string `json:"smtpHost"`
		SMTPPort string `json:"smtpPort"`
	}
	err = json.Unmarshal([]byte(configStr), &config)
	if err != nil {
		return fmt.Errorf("解析配置失败: %v", err)
	}

	e := email.NewEmail()
	e.From = config.Sender
	e.To = []string{config.Receiver}
	e.Subject = params["subject"].(string)

	e.Text = []byte(params["body"].(string))

	addr := fmt.Sprintf("%s:%s", config.SMTPHost, config.SMTPPort)

	auth := smtp.PlainAuth("", config.Sender, config.Password, config.SMTPHost)

	// 使用 SSL（通常是 465）
	if config.SMTPPort == "465" {
		tlsConfig := &tls.Config{
			InsecureSkipVerify: true, // 开发阶段跳过证书验证，生产建议关闭
			ServerName:         config.SMTPHost,
		}
		err = e.SendWithTLS(addr, auth, tlsConfig)
		if err != nil {
			if err.Error() == "EOF" || strings.Contains(err.Error(), "short response") || err.Error() == "server response incomplete" {
				// 忽略短响应错误
				return nil
			}
			return err
		}
		return nil
	}

	// 普通明文发送（25端口，非推荐）
	err = e.Send(addr, auth)
	if err != nil {
		if err.Error() == "EOF" || strings.Contains(err.Error(), "short response") || err.Error() == "server response incomplete" {
			// 忽略短响应错误
			return nil
		}
		return err
	}
	return nil
}
