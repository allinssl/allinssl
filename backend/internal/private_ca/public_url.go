package private_ca

import (
	"ALLinSSL/backend/public"
	"fmt"
	"net/url"
	"strings"
)

// PublicBaseURL 返回用于写入证书扩展的公网可访问基址。
// 优先读取 settings.public_base_url；未配置时用当前监听端口拼默认值。
// 示例：https://ca.example.com  或  http://127.0.0.1:20773
func PublicBaseURL() string {
	base := strings.TrimSpace(public.GetSettingIgnoreError("public_base_url"))
	if base != "" {
		return strings.TrimRight(base, "/")
	}
	port := public.Port
	if port == "" {
		port = "8888"
	}
	scheme := "http"
	if public.GetSettingIgnoreError("https") == "1" {
		scheme = "https"
	}
	return fmt.Sprintf("%s://127.0.0.1:%s", scheme, port)
}

// CRLDistributionURL 返回指定 CA 的 CRL 下载地址。
func CRLDistributionURL(caId int64) string {
	return fmt.Sprintf("%s/v1/private_ca/public/crl?ca_id=%d", PublicBaseURL(), caId)
}

// OCSPServerURL 返回 OCSP 应答器地址。
func OCSPServerURL() string {
	return fmt.Sprintf("%s/v1/private_ca/public/ocsp", PublicBaseURL())
}

// ValidatePublicBaseURL 校验配置的基址是否为合法 URL（可选辅助）。
func ValidatePublicBaseURL(raw string) error {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	u, err := url.Parse(raw)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return fmt.Errorf("public_base_url 无效，请使用完整 URL，例如 https://ca.example.com")
	}
	return nil
}
