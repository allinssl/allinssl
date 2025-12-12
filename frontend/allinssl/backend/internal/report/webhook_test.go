package report

import (
	"ALLinSSL/backend/public"
	"context"
	"testing"
)

func TestSend(test *testing.T) {
	logger, _ := public.NewLogger("/tmp/test.log")
	
	jsonConfig := &ReportConfig{
		Url:     "http://localhost:9939/demo/any",
		Method:  "GET",
		Headers: `X-Auth-Token: secret123`,
		Data:    `{"username": "zszs", "password": "get"}`,
	}
	
	jsonConfig1 := &ReportConfig{
		Url:    "http://localhost:9939/demo/any",
		Method: "post",
		Headers: `
			Content-Type: application/json
			X-Auth-Token: secret123`,
		Data: `{"username": "zszs", "password": "post-json"}`,
	}
	
	jsonConfig2 := &ReportConfig{
		Url:    "http://localhost:9939/demo/any",
		Method: "post",
		Headers: `
			Content-Type: application/x-www-form-urlencoded
			X-Auth-Token: secret123`,
		Data: `{"username": "zszs", "password": "post-form-urlencoded"}`,
	}
	
	jsonConfig3 := &ReportConfig{
		Url:    "http://localhost:9939/demo/any",
		Method: "post",
		Headers: `
			Content-Type: multipart/form-data
			X-Auth-Token: secret123`,
		Data: `{"username": "zszs", "password": "post-form-data"}`,
	}
	
	reqs := []*ReportConfig{jsonConfig, jsonConfig1, jsonConfig2, jsonConfig3}
	
	for _, req := range reqs {
		// 创建报告器
		jsonReporter := NewWebHookReporter(req, logger)
		
		// 发送请求
		ctx := context.Background()
		if err := jsonReporter.Send(ctx); err != nil {
			test.Error("JSON Webhook发送失败", "error", err)
			continue
		}
		
		test.Log("JSON Webhook发送成功", "url", req.Url, "method", req.Method)
	}
}

func TestNotifyWebHook(test *testing.T) {
	params := map[string]any{
		"provider_id": "2",
		"body":        "测试消息通道",
		"subject":     "测试消息通道",
	}
	
	err := NotifyWebHook(params)
	if err != nil {
		test.Error("NotifyWebHook failed", "error", err)
	} else {
		test.Log("NotifyWebHook success")
	}
}
