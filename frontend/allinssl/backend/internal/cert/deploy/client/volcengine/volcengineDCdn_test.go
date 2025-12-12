package deploy

import (
	"fmt"
	"testing"
)

func TestVolcEngineDcdnClient_IDCDNCreateCertBindInput(t *testing.T) {
	id := "cert-"
	domain := "hsdcdn.xxxx.com"
	
	client, _ := ClientVolcEngineDcdn("", "==", "cn-north-1")
	
	err := client.IDCDNCreateCertBindInput(id, domain)
	if err != nil {
		fmt.Printf("err:%+v", err)
		return
	}
}
