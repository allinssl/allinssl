package customapi

import (
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"

	"github.com/tjfoc/gmsm/sm2"
	"github.com/tjfoc/gmsm/sm3"
	"github.com/tjfoc/gmsm/sm4"
	gmx509 "github.com/tjfoc/gmsm/x509"
)

// ============= SM3 摘要 =============

func sm3Sum(data string) []byte {
	h := sm3.New()
	h.Write([]byte(data))
	return h.Sum(nil)
}

// ============= SM2 密钥解析 =============

// parseSM2PrivateKey 解析 SM2 私钥，支持完整 PEM 或纯 base64 内容
func parseSM2PrivateKey(keyPEM string) (*sm2.PrivateKey, error) {
	if key, err := gmx509.ReadPrivateKeyFromPem([]byte(keyPEM), nil); err == nil {
		return key, nil
	}
	der, err := derFromPEMOrBase64(keyPEM)
	if err != nil {
		return nil, fmt.Errorf("不是有效的 SM2 私钥: %w", err)
	}
	key, err := gmx509.ParsePKCS8PrivateKey(der, nil)
	if err != nil {
		return nil, fmt.Errorf("SM2 私钥解析失败: %w", err)
	}
	return key, nil
}

// parseSM2PublicKey 解析 SM2 公钥，支持完整 PEM 或纯 base64 内容
func parseSM2PublicKey(pubPEM string) (*sm2.PublicKey, error) {
	if pub, err := gmx509.ReadPublicKeyFromPem([]byte(pubPEM)); err == nil {
		return pub, nil
	}
	der, err := derFromPEMOrBase64(pubPEM)
	if err != nil {
		return nil, fmt.Errorf("不是有效的 SM2 公钥: %w", err)
	}
	pubAny, err := gmx509.ParsePKIXPublicKey(der)
	if err != nil {
		return nil, fmt.Errorf("SM2 公钥解析失败: %w", err)
	}
	pub, ok := pubAny.(*sm2.PublicKey)
	if !ok {
		return nil, fmt.Errorf("不是 SM2 公钥")
	}
	return pub, nil
}

// ============= SM2 签名 / 加解密 =============

// sm2SignRaw SM2 签名（ASN.1 编码的 r||s），返回原始字节
func sm2SignRaw(keyPEM, text string) (string, error) {
	key, err := parseSM2PrivateKey(keyPEM)
	if err != nil {
		return "", err
	}
	r, s, err := sm2.Sm2Sign(key, []byte(text), nil, rand.Reader)
	if err != nil {
		return "", fmt.Errorf("SM2 签名失败: %w", err)
	}
	sig, err := sm2.SignDigitToSignData(r, s)
	if err != nil {
		return "", fmt.Errorf("SM2 签名编码失败: %w", err)
	}
	return string(sig), nil
}

// sm2EncryptBase64 SM2 加密（C1C3C2 原始拼接格式），返回 base64
func sm2EncryptBase64(pubPEM, plaintext string) (string, error) {
	pub, err := parseSM2PublicKey(pubPEM)
	if err != nil {
		return "", err
	}
	ct, err := sm2.Encrypt(pub, []byte(plaintext), rand.Reader, sm2.C1C3C2)
	if err != nil {
		return "", fmt.Errorf("SM2 加密失败: %w", err)
	}
	return base64.StdEncoding.EncodeToString(ct), nil
}

// sm2DecryptBase64 SM2 解密（C1C3C2 原始拼接格式），输入 base64 密文
func sm2DecryptBase64(keyPEM, ciphertextB64 string) (string, error) {
	key, err := parseSM2PrivateKey(keyPEM)
	if err != nil {
		return "", err
	}
	raw, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return "", fmt.Errorf("密文 base64 解码失败: %w", err)
	}
	pt, err := sm2.Decrypt(key, raw, sm2.C1C3C2)
	if err != nil {
		return "", fmt.Errorf("SM2 解密失败: %w", err)
	}
	return string(pt), nil
}

// ============= SM4 加解密（PKCS7 填充，base64 输入输出） =============

func newSM4Cipher(key string) (cipher.Block, error) {
	block, err := sm4.NewCipher([]byte(key))
	if err != nil {
		return nil, fmt.Errorf("SM4 密钥长度须为 16 字节: %w", err)
	}
	return block, nil
}

// sm4CBCEncrypt SM4-CBC 加密，key/iv 均为 16 字节原文，返回 base64
func sm4CBCEncrypt(key, iv, plaintext string) (string, error) {
	block, err := newSM4Cipher(key)
	if err != nil {
		return "", err
	}
	if len(iv) != block.BlockSize() {
		return "", fmt.Errorf("SM4-CBC 的 IV 长度必须为 %d 字节", block.BlockSize())
	}
	data := pkcs7Pad([]byte(plaintext), block.BlockSize())
	out := make([]byte, len(data))
	cipher.NewCBCEncrypter(block, []byte(iv)).CryptBlocks(out, data)
	return base64.StdEncoding.EncodeToString(out), nil
}

// sm4CBCDecrypt SM4-CBC 解密，输入 base64 密文
func sm4CBCDecrypt(key, iv, ciphertextB64 string) (string, error) {
	block, err := newSM4Cipher(key)
	if err != nil {
		return "", err
	}
	if len(iv) != block.BlockSize() {
		return "", fmt.Errorf("SM4-CBC 的 IV 长度必须为 %d 字节", block.BlockSize())
	}
	raw, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return "", fmt.Errorf("密文 base64 解码失败: %w", err)
	}
	if len(raw) == 0 || len(raw)%block.BlockSize() != 0 {
		return "", fmt.Errorf("密文长度不是块大小的整数倍")
	}
	out := make([]byte, len(raw))
	cipher.NewCBCDecrypter(block, []byte(iv)).CryptBlocks(out, raw)
	data, err := pkcs7Unpad(out, block.BlockSize())
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// sm4ECBEncrypt SM4-ECB 加密，返回 base64
func sm4ECBEncrypt(key, plaintext string) (string, error) {
	block, err := newSM4Cipher(key)
	if err != nil {
		return "", err
	}
	data := pkcs7Pad([]byte(plaintext), block.BlockSize())
	out := make([]byte, len(data))
	bs := block.BlockSize()
	for i := 0; i < len(data); i += bs {
		block.Encrypt(out[i:i+bs], data[i:i+bs])
	}
	return base64.StdEncoding.EncodeToString(out), nil
}

// sm4ECBDecrypt SM4-ECB 解密，输入 base64 密文
func sm4ECBDecrypt(key, ciphertextB64 string) (string, error) {
	block, err := newSM4Cipher(key)
	if err != nil {
		return "", err
	}
	raw, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return "", fmt.Errorf("密文 base64 解码失败: %w", err)
	}
	if len(raw) == 0 || len(raw)%block.BlockSize() != 0 {
		return "", fmt.Errorf("密文长度不是块大小的整数倍")
	}
	out := make([]byte, len(raw))
	bs := block.BlockSize()
	for i := 0; i < len(raw); i += bs {
		block.Decrypt(out[i:i+bs], raw[i:i+bs])
	}
	data, err := pkcs7Unpad(out, block.BlockSize())
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// ============= 供 callFunction 调用的入口 =============

func sm3Hex(text string) string {
	return hex.EncodeToString(sm3Sum(text))
}

func hmacSM3Hex(key, text string) string {
	mac := hmac.New(sm3.New, []byte(key))
	mac.Write([]byte(text))
	return hex.EncodeToString(mac.Sum(nil))
}

func hmacSM3Raw(key, text string) string {
	mac := hmac.New(sm3.New, []byte(key))
	mac.Write([]byte(text))
	return string(mac.Sum(nil))
}
