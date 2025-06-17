package cert

import (
	"ALLinSSL/backend/public"
	"fmt"
	"strconv"
	"strings"
	"time"
)

func GetSqlite() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "cert"
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
			limits[1] = limit
		}
	}

	if search != "" {
		count, err = s.Where("domains like ?", []interface{}{"%" + search + "%"}).Count()
		data, err = s.Where("domains like ?", []interface{}{"%" + search + "%"}).Limit(limits).Order("end_time", "esc").Select()
	} else {
		count, err = s.Count()
		data, err = s.Order("end_time", "esc").Limit(limits).Select()
	}
	if err != nil {
		return data, 0, err
	}
	for _, v := range data {
		endtime, err := time.Parse("2006-01-02 15:04:05", v["end_time"].(string))
		if err != nil {
			continue
		}
		v["end_day"] = strconv.FormatInt(int64(endtime.Sub(time.Now())/(24*time.Hour)), 10)
	}
	return data, int(count), nil
}

func AddCert(source, key, cert, issuer, issuerCert, domains, sha256, historyId, startTime, endTime, endDay string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	workflowId := ""
	if historyId != "" {
		s, err := public.NewSqlite("data/data.db", "")
		if err != nil {
			return err
		}
		s.TableName = "workflow_history"
		defer s.Close()
		// 查询 workflowId
		wh, err := s.Where("id=?", []interface{}{historyId}).Select()
		if err != nil {
			return err
		}
		if len(wh) > 0 {
			workflowId = wh[0]["workflow_id"].(string)
		}
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = s.Insert(map[string]any{
		"source":      source,
		"key":         key,
		"cert":        cert,
		"issuer":      issuer,
		"issuer_cert": issuerCert,
		"domains":     domains,
		"sha256":      sha256,
		"history_id":  historyId,
		"workflow_id": workflowId,
		"create_time": now,
		"update_time": now,
		"start_time":  startTime,
		"end_time":    endTime,
		"end_day":     endDay,
	})
	if err != nil {
		return err
	}
	return nil
}

func SaveCert(source, key, cert, issuerCert, historyId string) (string, error) {
	if err := public.ValidateSSLCertificate(cert, key); err != nil {
		return "", err
	}

	certObj, err := public.ParseCertificate([]byte(cert))
	if err != nil {
		return "", fmt.Errorf("解析证书失败: %v", err)
	}
	// SHA256
	sha256, err := public.GetSHA256(cert)
	if err != nil {
		return "", fmt.Errorf("获取 SHA256 失败: %v", err)
	}
	if d, _ := GetCert(sha256); d != nil {
		return sha256, nil
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

	// 提取 CA 名称（Issuer 的组织名）
	caName := "UNKNOWN"
	if len(certObj.Issuer.Organization) > 0 {
		caName = certObj.Issuer.Organization[0]
	} else if certObj.Issuer.CommonName != "" {
		caName = certObj.Issuer.CommonName
	}
	// 证书有效期
	startTime := certObj.NotBefore.Format("2006-01-02 15:04:05")
	endTime := certObj.NotAfter.Format("2006-01-02 15:04:05")
	endDay := fmt.Sprintf("%d", int(certObj.NotAfter.Sub(time.Now()).Hours()/24))

	err = AddCert(source, key, cert, caName, issuerCert, domainList, sha256, historyId, startTime, endTime, endDay)
	if err != nil {
		return "", fmt.Errorf("保存证书失败: %v", err)
	}
	return sha256, nil
}

func UploadCert(key, cert string) (string, error) {
	sha256, err := SaveCert("upload", key, cert, "", "")
	if err != nil {
		return sha256, fmt.Errorf("保存证书失败: %v", err)
	}
	return sha256, nil
}

func DelCert(id string) error {
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

func GetCert(id string) (map[string]string, error) {
	s, err := GetSqlite()
	if err != nil {
		return nil, err
	}
	defer s.Close()

	res, err := s.Where("id=? or sha256=?", []interface{}{id, id}).Select()
	if err != nil {
		return nil, err
	}
	if len(res) == 0 {
		return nil, fmt.Errorf("证书不存在")
	}

	data := map[string]string{
		"domains": res[0]["domains"].(string),
		"cert":    res[0]["cert"].(string),
		"key":     res[0]["key"].(string),
	}

	return data, nil
}

// ========================================================
