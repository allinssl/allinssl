package report

import (
	"fmt"
	"testing"
)

func TestMail(t *testing.T) {
	config := map[string]any{
		"provider":    "mail",
		"provider_id": "4",
		"subject":     "执行结束",
		"body":        "执行结束",
	}
	err := NotifyMail(config)
	fmt.Println(err)
}
