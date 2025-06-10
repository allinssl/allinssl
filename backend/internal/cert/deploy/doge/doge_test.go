package doge

import (
	"fmt"
	"os"
	"testing"
)

func TestPlugin(t *testing.T) {
	err := DeployCdn(map[string]interface{}{
		"access_key": "xxxxxx",
		"secret_key": "xxxxx",
		"key":        "xxxxx",
		"cert":       "xxxxx",
		"domain":     "xx.com",
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "调用插件失败: %v\n", err)
		os.Exit(1)
	}
}
