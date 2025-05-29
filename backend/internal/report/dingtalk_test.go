package report

import (
	"testing"
)

func TestDingdingSend(test *testing.T) {
	report := NewDingtalkReport("", "")
	err := report.SendText("test msg")
	if err != nil {
		test.Errorf("Dingding failed: %v", err)
	}
}

func TestNotifyDingding(test *testing.T) {
	params := map[string]any{
		"provider_id": "4",
		"body":        "测试消息通道",
		"subject":     "测试消息通道",
	}
	
	err := NotifyDingtalk(params)
	if err != nil {
		test.Error("NotifyDingtalk failed", "error", err)
	} else {
		test.Log("NotifyDingtalk success")
	}
}
