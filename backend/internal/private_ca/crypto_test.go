package private_ca

import (
	"os"
	"testing"
)

func TestEncryptDecryptWithMaster(t *testing.T) {
	// set a 32-byte master key for test
	os.Setenv("ALLINSSL_MASTER_KEY", "01234567012345670123456701234567")
	plain := []byte("this-is-a-test-private-key-bytes")
	ciphertext, iv, err := EncryptWithMaster(plain)
	if err != nil {
		t.Fatalf("EncryptWithMaster failed: %v", err)
	}
	if len(ciphertext) == 0 || len(iv) == 0 {
		t.Fatalf("invalid ciphertext/iv")
	}
	out, err := DecryptWithMaster(ciphertext, iv)
	if err != nil {
		t.Fatalf("DecryptWithMaster failed: %v", err)
	}
	if string(out) != string(plain) {
		t.Fatalf("decrypted content mismatch: got %s", string(out))
	}
}