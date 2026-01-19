package private_ca

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"io"
	"os"
)

// getMasterKey 从环境变量读取 32 字节 key（可在生产用 KMS 注入或通过 CI secret 提供）
func getMasterKey() ([]byte, error) {
	k := os.Getenv("ALLINSSL_MASTER_KEY")
	if len(k) == 0 {
		return nil, errors.New("missing ALLINSSL_MASTER_KEY")
	}
	// 注意：实际环境中可用 base64 存储/读取，这里假定原始 bytes
	if len([]byte(k)) != 32 {
		return nil, errors.New("ALLINSSL_MASTER_KEY must be 32 bytes")
	}
	return []byte(k), nil
}

// EncryptWithMaster encrypts plain bytes using AES-GCM with master key.
// Returns ciphertext and nonce (iv).
func EncryptWithMaster(plain []byte) ([]byte, []byte, error) {
	key, err := getMasterKey()
	if err != nil {
		return nil, nil, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, nil, err
	}
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, nil, err
	}
	iv := make([]byte, aesgcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, nil, err
	}
	ciphertext := aesgcm.Seal(nil, iv, plain, nil)
	return ciphertext, iv, nil
}

func DecryptWithMaster(ciphertext, iv []byte) ([]byte, error) {
	key, err := getMasterKey()
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	plain, err := aesgcm.Open(nil, iv, ciphertext, nil)
	if err != nil {
		return nil, err
	}
	return plain, nil
}