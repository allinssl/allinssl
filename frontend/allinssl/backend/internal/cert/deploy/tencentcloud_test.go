package deploy

import "testing"

func TestTencentCloudAPITest(t *testing.T) {
	result := TencentCloudAPITest("9")
	if result != nil {
		t.Fatalf("SSHAPITest failed: %v", result)
	} else {
		t.Log("SSHAPITest success")
	}
}
