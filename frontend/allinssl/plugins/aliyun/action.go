package main

import (
	"ALLinSSL/plugins/aliyun/cas"
	"ALLinSSL/plugins/aliyun/esa"
	"fmt"
	"strconv"
	"strings"
)

func uploadToCAS(cfg map[string]any) (*Response, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config cannot be nil")
	}
	certStr, ok := cfg["cert"].(string)
	if !ok || certStr == "" {
		return nil, fmt.Errorf("cert is required and must be a string")
	}
	keyStr, ok := cfg["key"].(string)
	if !ok || keyStr == "" {
		return nil, fmt.Errorf("key is required and must be a string")
	}
	accessKey, ok := cfg["access_key"].(string)
	if !ok || accessKey == "" {
		return nil, fmt.Errorf("access_key is required and must be a string")
	}
	secretKey, ok := cfg["secret_key"].(string)
	if !ok || secretKey == "" {
		return nil, fmt.Errorf("secret_key is required and must be a string")
	}
	endpoint, ok := cfg["endpoint"].(string)
	if !ok || endpoint == "" {
		endpoint = "cas.ap-southeast-1.aliyuncs.com" // 默认值
	}
	name, ok := cfg["name"].(string)
	if !ok || name == "" {
		name = "allinssl-certificate" // 默认名称
	}

	client, err := cas.CreateClient(accessKey, secretKey, endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to create CAS client: %w", err)
	}
	// 上传证书到 CAS
	err = cas.UploadToCas(client, certStr, keyStr, name)
	if err != nil {
		return nil, fmt.Errorf("failed to upload certificate to CAS: %w", err)
	}

	return &Response{
		Status:  "success",
		Message: "CAS upload successful",
		Result:  nil,
	}, nil
}

func deployToESA(cfg map[string]any) (*Response, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config cannot be nil")
	}
	certPEM, ok := cfg["cert"].(string)
	if !ok || certPEM == "" {
		return nil, fmt.Errorf("cert is required and must be a string")
	}
	privkeyPEM, ok := cfg["key"].(string)
	if !ok || privkeyPEM == "" {
		return nil, fmt.Errorf("key is required and must be a string")
	}
	accessKey, ok := cfg["access_key"].(string)
	if !ok || accessKey == "" {
		return nil, fmt.Errorf("access_key is required and must be a string")
	}
	secretKey, ok := cfg["secret_key"].(string)
	if !ok || secretKey == "" {
		return nil, fmt.Errorf("secret_key is required and must be a string")
	}
	var siteID int64
	switch v := cfg["site_id"].(type) {
	case float64:
		siteID = int64(v)
	case string:
		var err error
		siteID, err = strconv.ParseInt(v, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("site_id format error: %w", err)
		}
	case int:
		siteID = int64(v)
	default:
		return nil, fmt.Errorf("site_id format error")
	}
	var delRepeatDomainCert bool
	switch v := cfg["del_repeat_domain_cert"].(type) {
	case bool:
		delRepeatDomainCert = v
	case string:
		if v == "true" {
			delRepeatDomainCert = true
		}
	case nil:
		delRepeatDomainCert = false
	}

	client, err := esa.CreateEsaClient(accessKey, secretKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create ESA client: %w", err)
	}

	// 检查是否需要删除重复的域名证书
	if delRepeatDomainCert {
		// 解析现有证书的域名
		certObj, err := ParseCertificate([]byte(certPEM))
		if err != nil {
			return nil, fmt.Errorf("failed to parse certificate: %w", err)
		}
		domainSet := make(map[string]bool)

		if certObj.Subject.CommonName != "" {
			domainSet[certObj.Subject.CommonName] = true
		}
		for _, dns := range certObj.DNSNames {
			domainSet[dns] = true
		}

		// 转成切片并拼接成逗号分隔的字符串
		var domains []string
		for domain := range domainSet {
			domains = append(domains, domain)
		}
		domainList := strings.Join(domains, ",")

		certList, err := esa.ListCertFromESA(client, siteID)
		if err != nil {
			return nil, fmt.Errorf("failed to list certificates from ESA: %w", err)
		}
		for _, cert := range certList {
			if *cert.SAN == domainList {
				err = esa.DeleteEsaCert(client, siteID, *cert.Id)
				if err != nil {
					return nil, fmt.Errorf("failed to delete existing certificate: %w", err)
				}
			}
		}
	}

	err = esa.UploadCertToESA(client, siteID, certPEM, privkeyPEM)
	if err != nil {
		return nil, fmt.Errorf("failed to upload certificate to ESA: %w", err)
	}

	return &Response{
		Status:  "success",
		Message: "ESA deployment successful",
		Result:  nil,
	}, nil
}
