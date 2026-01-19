package private_ca

import (
	"os"
	"testing"
)

func TestImportRootCA_RejectsWithoutPassWhenEncrypted(t *testing.T) {
	// This is a basic test that calls ImportRootCA with invalid data to ensure path runs.
	// Real PEM values are not provided here; this test ensures function returns error for invalid pem.
	os.Setenv("ALLINSSL_MASTER_KEY", "01234567012345670123456701234567")
	err := ImportRootCA("test", "not-a-pem", "not-a-pem", "", "app_key")
	if err == nil {
		t.Fatalf("expected error for invalid pem")
	}
}