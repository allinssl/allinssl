package report

import (
	"testing"
)

func TestFeishuSend(test *testing.T) {
	report := NewFeishuReport("", "")
	err := report.SendText("test msg")
	if err != nil {
		test.Errorf("FeishuSend failed: %v", err)
	}
}

func TestNotifyFeishu(test *testing.T) {
	params := map[string]any{
		"provider_id": "3",
		"body":        "测试消息通道",
		"subject":     "测试消息通道",
	}
	
	err := NotifyFeishu(params)
	if err != nil {
		test.Error("NotifyWebHook failed", "error", err)
	} else {
		test.Log("NotifyWebHook success")
	}
}
