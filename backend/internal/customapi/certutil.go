package customapi

import (
	"ALLinSSL/backend/public"
	"strings"
)

// DomainsFromCertPEM 从证书 PEM 提取域名：
// domains 为逗号分隔的 SAN 列表，domain 为首个域名；无 SAN 时回退 CN，解析失败返回空。
func DomainsFromCertPEM(certPEM string) (domains, domain string) {
	cert, err := public.ParseCertificate([]byte(certPEM))
	if err != nil {
		return "", ""
	}
	names := cert.DNSNames
	if len(names) == 0 && cert.Subject.CommonName != "" {
		names = []string{cert.Subject.CommonName}
	}
	if len(names) == 0 {
		return "", ""
	}
	return strings.Join(names, ","), names[0]
}
