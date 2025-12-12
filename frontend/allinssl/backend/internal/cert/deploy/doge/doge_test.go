package doge

import (
	"fmt"
	"os"
	"testing"
)

func TestPlugin(t *testing.T) {
	err := os.Chdir("D:/code/ALLinSSL")
	if err != nil {
		fmt.Fprintf(os.Stderr, "切换目录失败: %v\n", err)
		os.Exit(1)
	}
	err = DeployCdn(map[string]interface{}{
		"provider_id": "xx",
		"certificate": map[string]any{
			"key":  "xx",
			"cert": "xx",
		},
		"domain": "xx",
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "调用插件失败: %v\n", err)
		os.Exit(1)
	}
}
