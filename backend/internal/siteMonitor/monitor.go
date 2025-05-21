package siteMonitor

import (
	"ALLinSSL/backend/public"
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"
)

// SSLInfo 定义结果结构体
type SSLInfo struct {
	Target          string
	HTTPStatus      int
	HTTPStatusText  string
	Domains         []string
	Issuer          string
	NotBefore       string
	NotAfter        string
	DaysRemaining   int
	CertificateOK   bool
	CertificateNote string
}

func GetSqlite() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/site_monitor.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "site_monitor"
	return s, nil
}

func GetList(search string, p, limit int64) ([]map[string]any, int, error) {
	var data []map[string]any
	var count int64
	s, err := GetSqlite()
	if err != nil {
		return data, 0, err
	}
	defer s.Close()

	var limits []int64
	if p >= 0 && limit >= 0 {
		limits = []int64{0, limit}
		if p > 1 {
			limits[0] = (p - 1) * limit
			limits[1] = p * limit
		}
	}

	if search != "" {
		count, err = s.Where("name like ? or site_domain like ?", []interface{}{"%" + search + "%", "%" + search + "%"}).Count()
		data, err = s.Where("name like ? or site_domain like ?", []interface{}{"%" + search + "%", "%" + search + "%"}).Order("update_time", "desc").Limit(limits).Select()
	} else {
		count, err = s.Count()
		data, err = s.Order("update_time", "desc").Limit(limits).Select()
	}
	if err != nil {
		return data, 0, err
	}
	for _, v := range data {
		v["domain"] = v["site_domain"]
	}

	return data, int(count), nil
}

func AddMonitor(name, domain, reportType string, cycle int) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	info, err := CheckWebsite(domain)
	if err != nil {
		return err
	}
	_, err = s.Insert(map[string]any{
		"name":        name,
		"site_domain": domain,
		"report_type": reportType,
		"cycle":       cycle,
		"state":       info.HTTPStatusText,
		"ca":          info.Issuer,
		"cert_domain": strings.Join(info.Domains, ","),
		"end_time":    info.NotAfter,
		"end_day":     info.DaysRemaining,
		"create_time": time.Now().Format("2006-01-02 15:04:05"),
		"update_time": time.Now().Format("2006-01-02 15:04:05"),
		"last_time":   time.Now().Format("2006-01-02 15:04:05"),
		"active":      1,
	})
	if err != nil {
		return err
	}
	return nil
}

func UpdMonitor(id, name, domain, reportType string, cycle int) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()

	info, err := CheckWebsite(domain)
	if err != nil {
		return err
	}
	_, err = s.Where("id=?", []interface{}{id}).Update(map[string]any{
		"name":        name,
		"site_domain": domain,
		"report_type": reportType,
		"cycle":       cycle,
		"state":       info.HTTPStatusText,
		"ca":          info.Issuer,
		"cert_domain": strings.Join(info.Domains, ","),
		"end_time":    info.NotAfter,
		"end_day":     info.DaysRemaining,
		"update_time": time.Now().Format("2006-01-02 15:04:05"),
		"last_time":   time.Now().Format("2006-01-02 15:04:05"),
		"active":      1,
	})
	if err != nil {
		return err
	}
	return nil
}

func DelMonitor(id string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	_, err = s.Where("id=?", []interface{}{id}).Delete()
	if err != nil {
		return err
	}
	return nil
}

func SetMonitor(id string, active int) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	_, err = s.Where("id=?", []interface{}{id}).Update(map[string]any{
		"active":      active,
		"update_time": time.Now().Format("2006-01-02 15:04:05"),
	})
	if err != nil {
		return err
	}
	return nil
}

func UpdInfo(id, domain string, s *public.Sqlite, reportType string) error {
	info, errCheck := CheckWebsite(domain)
	now := time.Now()
	updateData := map[string]any{
		"state":           info.HTTPStatusText,
		"ca":              info.Issuer,
		"cert_domain":     strings.Join(info.Domains, ","),
		"end_time":        info.NotAfter,
		"end_day":         info.DaysRemaining,
		"last_time":       now.Format("2006-01-02 15:04:05"),
		"except_end_time": now.Format("2006-01-02 15:04:05"),
	}
	if errCheck != nil {
		updateData["state"] = "异常"
		// return err
	} else {
		if info.HTTPStatus != 0 && info.CertificateOK != false {
			delete(updateData, "except_end_time")
		} else {
			errCheck = fmt.Errorf("证书异常")
		}
	}
	_, err := s.Where("id=?", []interface{}{id}).Update(updateData)
	if err != nil {
		return err
	}
	return errCheck
}

// CheckWebsite 实际检测函数
func CheckWebsite(target string) (*SSLInfo, error) {
	result := &SSLInfo{Target: target}

	// 验证格式是否是 IP 或域名
	if net.ParseIP(target) == nil {
		if _, err := net.LookupHost(target); err != nil {
			return result, fmt.Errorf("无效域名或 IP：%v", err)
		}
	}

	hostPort := net.JoinHostPort(target, "443")

	// result := &SSLInfo{Target: target}

	// 1. TLS 连接（先做，否则无 HTTPS 支持直接失败）
	conn, err := tls.Dial("tcp", hostPort, &tls.Config{
		InsecureSkipVerify: true,
	})
	if err != nil {
		return result, fmt.Errorf("目标不支持 HTTPS：%v", err)
	}
	defer conn.Close()

	// 发送 HTTPS 请求检测状态
	resp, err := http.Get("https://" + target)
	if err != nil {
		result.HTTPStatus = 0
		result.HTTPStatusText = "异常"
	} else {
		result.HTTPStatus = resp.StatusCode
		result.HTTPStatusText = "正常"
		resp.Body.Close()
	}

	// 获取证书
	cert := conn.ConnectionState().PeerCertificates[0]
	result.Domains = cert.DNSNames
	result.Issuer = cert.Issuer.CommonName
	result.NotBefore = cert.NotBefore.Format("2006-01-02 15:04:05")
	result.NotAfter = cert.NotAfter.Format("2006-01-02 15:04:05")
	result.DaysRemaining = int(cert.NotAfter.Sub(time.Now()).Hours() / 24)

	now := time.Now()
	switch {
	case now.Before(cert.NotBefore):
		result.CertificateOK = false
		result.CertificateNote = "尚未生效"
	case now.After(cert.NotAfter):
		result.CertificateOK = false
		result.CertificateNote = "已过期"
	default:
		result.CertificateOK = true
		result.CertificateNote = "有效"
	}

	return result, nil
}
