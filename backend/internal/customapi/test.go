package customapi

import (
	"ALLinSSL/backend/internal/access"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"math/big"
	"time"
)

// TestVars 构造测试变量：签发/告警用固定示例值，部署场景额外生成自签证书
func TestVars(usage string) (map[string]string, error) {
	vars := map[string]string{
		"subject":   "测试消息主题",
		"body":      "测试消息内容",
		"domains":   "example.com,*.example.com",
		"domain":    "example.com",
		"email":     "admin@example.com",
		"algorithm": "RSA2048",
	}
	if usage == "host" {
		certPEM, keyPEM, err := generateSelfSignedTestCert()
		if err != nil {
			return nil, err
		}
		vars["cert"] = certPEM
		vars["key"] = keyPEM
		vars["issuer_cert"] = certPEM
	}
	if usage == "dns" {
		// DNS-01 挑战场景的示例变量
		vars["domain"] = "_acme-challenge.example.com"
		vars["fqdn"] = "_acme-challenge.example.com"
		vars["value"] = "test-txt-value"
		vars["token"] = "test-token"
		vars["action"] = "present"
		vars["domains"] = "example.com"
	}
	return vars, nil
}

// generateSelfSignedTestCert 生成测试用自签名证书（example.com / *.example.com）
func generateSelfSignedTestCert() (certPEM, keyPEM string, err error) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return "", "", fmt.Errorf("生成测试密钥失败: %w", err)
	}
	tmpl := x509.Certificate{
		SerialNumber:          big.NewInt(1),
		Subject:               pkix.Name{CommonName: "example.com"},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(24 * time.Hour),
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		BasicConstraintsValid: true,
		DNSNames:              []string{"example.com", "*.example.com"},
	}
	der, err := x509.CreateCertificate(rand.Reader, &tmpl, &tmpl, &key.PublicKey, key)
	if err != nil {
		return "", "", fmt.Errorf("生成测试证书失败: %w", err)
	}
	certPEM = string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}))
	keyPEM = string(pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)}))
	return certPEM, keyPEM, nil
}

// Test 用示例变量执行一遍指定 access 提供方（type=custom_api）的配置，
// 供「测试」按钮验证多步请求是否连通、变量提取是否正确。
func Test(providerID string) error {
	if providerID == "" {
		return fmt.Errorf("缺少 provider_id")
	}
	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return err
	}
	configStr, _ := providerData["config"].(string)
	var config Config
	if err := json.Unmarshal([]byte(configStr), &config); err != nil {
		return fmt.Errorf("解析自定义API配置失败: %w", err)
	}
	usage := config.Usage
	vars, err := TestVars(usage)
	if err != nil {
		return err
	}
	_, err = Execute(&config, vars, nil)
	return err
}

