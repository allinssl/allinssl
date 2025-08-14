package monitor

import (
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/hex"
	"fmt"
	"net"
	"net/http"
	"net/smtp"
	"strings"
	"time"
)

// buildCertChainRecursive 构建证书链树结构
func buildCertChainRecursive(certs []*x509.Certificate, index int) *CertNode {
	if index >= len(certs) {
		return nil
	}
	node := &CertNode{
		CommonName: certs[index].Subject.CommonName,
		Subject:    certs[index].Subject.String(),
		Issuer:     certs[index].Issuer.String(),
	}
	if index+1 < len(certs) {
		child := buildCertChainRecursive(certs, index+1)
		if child != nil {
			node.Children = append(node.Children, child)
		}
	}
	return node
}

// checkChainRecursive 递归检查链条完整性
func checkChainRecursive(node *CertNode, level int) error {
	if node == nil || len(node.Children) == 0 {
		return nil
	}
	for _, child := range node.Children {
		if node.Issuer != child.Subject {
			return fmt.Errorf("证书链第 %d 层 [CN=%s] 的 Issuer 与第 %d 层 [CN=%s] 的 Subject 不匹配，链条断裂",
				level, node.CommonName,
				level+1, child.CommonName,
			)
		}
		if err := checkChainRecursive(child, level+1); err != nil {
			return err
		}
	}
	return nil
}

// Check 检查证书链的完整性和有效性
func Check(certs []*x509.Certificate, host string, advanceDay int) (result *CertInfo, err error) {
	result = &CertInfo{}
	if len(certs) == 0 {
		return nil, fmt.Errorf("未获取到服务端证书")
	}

	leafCert := certs[0]

	// 提取 CA 名称（Issuer 的组织名）
	result.CA = "UNKNOWN"
	if len(leafCert.Issuer.Organization) > 0 {
		result.CA = leafCert.Issuer.Organization[0]
	} else if leafCert.Issuer.CommonName != "" {
		result.CA = leafCert.Issuer.CommonName
	}

	result.CommonName = leafCert.Subject.CommonName
	result.NotBefore = leafCert.NotBefore.In(time.Local).Format("2006-01-02 15:04:05")
	result.NotAfter = leafCert.NotAfter.In(time.Local).Format("2006-01-02 15:04:05")
	result.DaysLeft = int(leafCert.NotAfter.Sub(time.Now()).Hours() / 24)
	result.SANs = strings.Join(leafCert.DNSNames, ",")
	result.SignatureAlgo = leafCert.SignatureAlgorithm.String()
	sha256Sum := sha256.Sum256(leafCert.Raw)
	result.Sha256 = hex.EncodeToString(sha256Sum[:])

	// 构建证书链树结构
	result.CertChain = buildCertChainRecursive(certs, 0)

	// 用系统根证书池校验是否受信任
	roots, err := x509.SystemCertPool()
	if err != nil {
		return nil, fmt.Errorf("加载系统根证书失败：%v", err)
	}
	if roots == nil {
		roots = x509.NewCertPool()
	}
	intermediates := x509.NewCertPool()
	for _, intermediate := range certs[1:] {
		intermediates.AddCert(intermediate)
	}
	opts := x509.VerifyOptions{
		DNSName:       host,
		Roots:         roots,
		Intermediates: intermediates,
	}
	if _, err := leafCert.Verify(opts); err != nil {
		result.Valid = false
		result.VerifyError = fmt.Sprintf("证书验证失败：%v", err)
		return result, nil
	} else if result.DaysLeft <= advanceDay {
		result.VerifyError = fmt.Sprintf("证书即将过期，剩余 %d 天，请及时更新", result.DaysLeft)
	} else if err := checkChainRecursive(result.CertChain, 1); err != nil {
		result.VerifyError = fmt.Sprintf("证书验证成功，但在检查真实获取到的证书链时出现问题：\n%v\n（可忽略，仅作提醒，如遇到ssl证书问题，可作为排查方向）", err)
	}

	result.Valid = true
	return result, nil
}

// CheckHttps 严格检查 HTTPS 证书链，基于 CertChain 结构检查链完整性
func CheckHttps(target string, advanceDay int) (result *CertInfo, err error) {
	// 解析 host 和 port
	host, port, err := net.SplitHostPort(target)
	if err != nil {
		host = target
		port = "443"
	}

	// 校验 host
	if net.ParseIP(host) == nil {
		if _, err := net.LookupHost(host); err != nil {
			return nil, fmt.Errorf("无效的域名或 IP：%v", err)
		}
	}

	// 拼接 HTTPS URL
	url := fmt.Sprintf("https://%s", net.JoinHostPort(host, port))

	// 构建 HTTP 客户端
	client := &http.Client{
		// 禁止重定向，确保获取到原始证书链
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// 返回错误以阻止重定向
			return http.ErrUseLastResponse
		},
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
			DisableKeepAlives: true,
		},
		Timeout: 30 * time.Second,
	}

	// 发送请求
	resp, err := client.Get(url)
	if err != nil {
		// 如果无法建立 HTTPS 连接，重试3次
		retryCount := 3
		for i := 0; i < retryCount; i++ {
			resp, err = client.Get(url)
			if err == nil {
				break // 成功则退出重试
			}
			time.Sleep(1 * time.Second) // 等待1秒后重试
		}
		if err != nil {
			return nil, fmt.Errorf("无法建立 HTTPS 连接：%v", err)
		}
	}
	defer resp.Body.Close()

	// 获取证书链
	certs := resp.TLS.PeerCertificates
	return Check(certs, host, advanceDay)
}

// CheckSmtp 检查smtp
func CheckSmtp(target string, advanceDay int) (result *CertInfo, err error) {
	// 解析 host 和 port
	host, port, err := net.SplitHostPort(target)
	if err != nil {
		host = target
		port = "465" // 默认端口
	}

	// 校验 host
	if net.ParseIP(host) == nil {
		if _, err := net.LookupHost(host); err != nil {
			return nil, fmt.Errorf("无效的域名或 IP：%v", err)
		}
	}
	// 如果端口是 465，使用 TCP
	if port == "465" {
		return CheckTCP(host, port, advanceDay)
	}

	// 建立smtp连接
	conn, err := smtp.Dial(host + ":" + port)
	if err != nil {
		return nil, fmt.Errorf("无法建立 SMTP 连接：%v", err)
	}
	defer conn.Close()
	// 升级到 TLS
	if err := conn.StartTLS(&tls.Config{
		InsecureSkipVerify: true,
		ServerName:         host,
	}); err != nil {
		return nil, fmt.Errorf("无法升级到 TLS：%v", err)
	}
	// 获取证书
	state, ok := conn.TLSConnectionState()
	if !ok {
		return nil, fmt.Errorf("无法获取 TLS 连接状态")
	}
	certs := state.PeerCertificates
	return Check(certs, host, advanceDay)
}

// CheckTCP 通过 tcp 连接检查证书
func CheckTCP(host, port string, advanceDay int) (result *CertInfo, err error) {
	// 建立 tcp 连接
	url := fmt.Sprintf("%s:%s", host, port)
	conn, err := tls.Dial("tcp", url, &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         host,
	})
	if err != nil {
		return nil, fmt.Errorf("无法建立tcp连接：%v", err)
	}
	defer conn.Close()
	// 获取证书链
	certs := conn.ConnectionState().PeerCertificates
	return Check(certs, host, advanceDay)
}
