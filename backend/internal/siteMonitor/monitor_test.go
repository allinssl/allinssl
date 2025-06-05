package siteMonitor

import (
	"fmt"
	"testing"
)

func Test(t *testing.T) {
	site := "bt.cn:443" // 只传域名或 IP，不要 http://
	result, err := CheckWebsite(site)
	if err != nil {
		fmt.Printf("❌ 检测失败: %v\n", err)
		return
	}
	fmt.Println(result.HTTPStatusText)
	fmt.Println(result.Domains)
	fmt.Println(result.Issuer)
	fmt.Println(result.NotAfter)
	// fmt.Println(result.Domains)
	// fmt.Println(result.Domains)
}
