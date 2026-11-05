package cert

import (
	"ALLinSSL/backend/public"
	"fmt"
	"strconv"
	"strings"
	"time"
)

const (
	CertStatusNormal  = "normal"
	CertStatusRevoked = "revoked"
)

// validACMERevokeReasons RFC 5280 §5.3.1 原因码
var validACMERevokeReasons = map[int]string{
	0:  "unspecified",
	1:  "keyCompromise",
	2:  "cACompromise",
	3:  "affiliationChanged",
	4:  "superseded",
	5:  "cessationOfOperation",
	6:  "certificateHold",
	8:  "removeFromCRL",
	9:  "privilegeWithdrawn",
	10: "aACompromise",
}

func GetSqlite() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "cert"
	return s, nil
}

func GetList(search string, p, limit, status int64) ([]map[string]any, int, error) {
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

	now := time.Now()
	nowStr := now.Format("2006-01-02 15:04:05")
	nowPlus30Days := now.AddDate(0, 0, 30)
	nowPlus30DaysStr := nowPlus30Days.Format("2006-01-02 15:04:05")

	filterSql := "1=1 "
	// status: -2 已吊销 -1 已过期 0/其它 全部 1 即将过期 2 正常
	if status == -2 {
		filterSql += "and status = 'revoked' "
	} else if status == -1 {
		filterSql += "and (status is null or status = '' or status = 'normal') and end_time <= '" + nowStr + "' "
	} else if status == 1 {
		filterSql += "and (status is null or status = '' or status = 'normal') and end_time > '" + nowStr + "' AND end_time <= '" + nowPlus30DaysStr + "' "
	} else if status == 2 {
		filterSql += "and (status is null or status = '' or status = 'normal') and end_time > '" + nowPlus30DaysStr + "' "
	}

	if search != "" {
		filterSql += "and domains like '%" + search + "%'"
	}
	count, err = s.Where(filterSql, []interface{}{}).Count()
	data, err = s.Where(filterSql, []interface{}{}).Order("end_time", "esc").Limit(limits).Select()

	if err != nil {
		return data, 0, err
	}
	for _, v := range data {
		endtime, err := time.Parse("2006-01-02 15:04:05", v["end_time"].(string))
		if err != nil {
			continue
		}
		v["end_day"] = strconv.FormatInt(int64(endtime.Sub(time.Now())/(24*time.Hour)), 10)
		if st, _ := v["status"].(string); st == "" {
			v["status"] = CertStatusNormal
		}
	}
	return data, int(count), nil
}

func AddCert(source, key, cert, issuer, issuerCert, domains, sha256, historyId, startTime, endTime, endDay, acmeEmail, acmeCA string) error {
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
		"source":        source,
		"key":           key,
		"cert":          cert,
		"issuer":        issuer,
		"issuer_cert":   issuerCert,
		"domains":       domains,
		"sha256":        sha256,
		"history_id":    historyId,
		"workflow_id":   workflowId,
		"create_time":   now,
		"update_time":   now,
		"start_time":    startTime,
		"end_time":      endTime,
		"end_day":       endDay,
		"status":        CertStatusNormal,
		"revoke_reason": "",
		"acme_email":    acmeEmail,
		"acme_ca":       acmeCA,
	})
	if err != nil {
		return err
	}
	return nil
}

// SaveCert 保存证书。acmeEmail/acmeCA 用于后续 ACME 吊销时定位账户；上传证书可传空。
func SaveCert(source, key, cert, issuerCert, historyId, acmeEmail, acmeCA string) (string, error) {
	if err := public.ValidateSSLCertificate(cert, key); err != nil {
		return "", err
	}

	certObj, err := public.ParseCertificate([]byte(cert))
	if err != nil {
		return "", fmt.Errorf("解析证书失败: %v", err)
	}
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
	for _, ip := range certObj.IPAddresses {
		domainSet[ip.String()] = true
	}

	var domains []string
	for domain := range domainSet {
		domains = append(domains, domain)
	}
	domainList := strings.Join(domains, ",")

	caName := "UNKNOWN"
	if len(certObj.Issuer.Organization) > 0 {
		caName = certObj.Issuer.Organization[0]
	} else if certObj.Issuer.CommonName != "" {
		caName = certObj.Issuer.CommonName
	}
	startTime := certObj.NotBefore.Format("2006-01-02 15:04:05")
	endTime := certObj.NotAfter.Format("2006-01-02 15:04:05")
	endDay := fmt.Sprintf("%d", int(certObj.NotAfter.Sub(time.Now()).Hours()/24))

	err = AddCert(source, key, cert, caName, issuerCert, domainList, sha256, historyId, startTime, endTime, endDay, acmeEmail, acmeCA)
	if err != nil {
		return "", fmt.Errorf("保存证书失败: %v", err)
	}
	return sha256, nil
}

func UploadCert(key, cert string) (string, error) {
	sha256, err := SaveCert("upload", key, cert, "", "", "", "")
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

	_, err = s.Where("id in ("+id+")", []interface{}{}).Delete()
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

// GetCertRow 返回完整证书行（含 ACME 元数据），供吊销流程使用。
func GetCertRow(id string) (map[string]any, error) {
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
	return res[0], nil
}

// MarkCertRevoked 将证书标记为已吊销（本地状态）。
func MarkCertRevoked(id any, reason string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = s.Where("id=?", []interface{}{id}).Update(map[string]interface{}{
		"status":        CertStatusRevoked,
		"revoke_reason": reason,
		"revoked_at":    now,
		"update_time":   now,
	})
	return err
}

// FormatRevokeReason 将原因码与备注格式化为存储字符串。
func FormatRevokeReason(reason int, reasonNote string) (string, error) {
	label, ok := validACMERevokeReasons[reason]
	if !ok {
		return "", fmt.Errorf("不支持的吊销原因码: %d", reason)
	}
	if reasonNote != "" {
		return label + ": " + reasonNote, nil
	}
	return label, nil
}

// ========================================================
