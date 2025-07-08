package monitor

import (
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
	"time"
)

func GetSqlite() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/monitor.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "monitor"
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
		count, err = s.Where("name like ? or target like ?", []interface{}{"%" + search + "%", "%" + search + "%"}).Count()
		data, err = s.Where("name like ? or target like ?", []interface{}{"%" + search + "%", "%" + search + "%"}).Order("update_time", "desc").Limit(limits).Select()
	} else {
		count, err = s.Count()
		data, err = s.Order("update_time", "desc").Limit(limits).Select()
	}
	if err != nil {
		return data, 0, err
	}
	for _, v := range data {
		info, ok := v["info"].(string)
		if !ok || info == "" {
			continue
		}
		var certInfo CertInfo
		err := json.Unmarshal([]byte(info), &certInfo)
		if err != nil {
			continue
		}
		v["common_name"] = certInfo.CommonName
		v["ca"] = certInfo.CA
		v["not_before"] = certInfo.NotBefore
		v["not_after"] = certInfo.NotAfter
		v["days_left"] = certInfo.DaysLeft
		v["sans"] = certInfo.SANs
		//v["valid"] = certInfo.Valid
		delete(v, "info")
	}
	return data, int(count), nil
}

func GetInfo(id string) (map[string]any, error) {
	s, err := GetSqlite()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	data, err := s.Where("id=?", []interface{}{id}).Select()
	if err != nil {
		return nil, err
	}
	if len(data) == 0 || data[0] == nil {
		return nil, fmt.Errorf("未找到对应的监控记录")
	}
	dataMap := data[0]

	monitorInfo := map[string]any{
		"id":           dataMap["id"],
		"name":         dataMap["name"],
		"target":       dataMap["target"],
		"monitor_type": dataMap["monitor_type"],
		"valid":        dataMap["valid"],
	}

	info, ok := dataMap["info"].(string)
	if !ok || info == "" {
		return monitorInfo, nil
	}
	var certInfo CertInfo
	err = json.Unmarshal([]byte(info), &certInfo)
	if err != nil {
		return monitorInfo, fmt.Errorf("解析证书信息失败: %v", err)
	}
	monitorInfo["common_name"] = certInfo.CommonName
	monitorInfo["ca"] = certInfo.CA
	monitorInfo["not_before"] = certInfo.NotBefore
	monitorInfo["not_after"] = certInfo.NotAfter
	monitorInfo["days_left"] = certInfo.DaysLeft
	monitorInfo["sans"] = certInfo.SANs
	//monitorInfo["valid"] = certInfo.Valid
	monitorInfo["verify_error"] = certInfo.VerifyError
	monitorInfo["cert_chain"] = certInfo.CertChain

	// 查询异常次数
	// 计算7天前的时间
	sevenDaysAgo := time.Now().AddDate(0, 0, -7).Format("2006-01-02 15:04:05")
	s.TableName = "err_record"
	errCount, err := s.Where("monitor_id=? and create_time >= ?", []interface{}{id, sevenDaysAgo}).Count()
	if err != nil {
		errCount = 0
	}
	monitorInfo["err_count"] = errCount

	return monitorInfo, nil
}

// AddMonitor 添加新的监控记录
func AddMonitor(name, target, monitorType, reportTypes, cycle, repeatSendGap, active, advanceDay string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	data := map[string]any{
		"name":            name,
		"target":          target,
		"monitor_type":    monitorType,
		"report_types":    reportTypes,
		"cycle":           cycle,
		"repeat_send_gap": repeatSendGap,
		"active":          active,
		"advance_day":     advanceDay,
		"create_time":     time.Now().Format("2006-01-02 15:04:05"),
		"update_time":     time.Now().Format("2006-01-02 15:04:05"),
	}
	if _, err := s.Insert(data); err != nil {
		return fmt.Errorf("添加监控记录失败: %v", err)
	}
	return nil
}

// UpdMonitor 更新监控记录
func UpdMonitor(id, name, target, reportTypes, cycle, repeatSendGap, active, advanceDay string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	data := map[string]any{
		"name":            name,
		"target":          target,
		"report_types":    reportTypes,
		"cycle":           cycle,
		"repeat_send_gap": repeatSendGap,
		"active":          active,
		"advance_day":     advanceDay,
		"update_time":     time.Now().Format("2006-01-02 15:04:05"),
		"info":            "", // 清空 info 字段
	}
	_, err = s.Where("id=?", []interface{}{id}).Update(data)
	if err != nil {
		return fmt.Errorf("更新监控记录失败: %v", err)
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
	s.TableName = "err_record"
	_, err = s.Where("monitor_id=?", []interface{}{id}).Delete()
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

func GetErrRecord(id, p, limit int64) ([]map[string]any, int, error) {
	var data []map[string]any
	var count int64
	s, err := public.NewSqlite("data/monitor.db", "")
	if err != nil {
		return data, 0, err
	}
	defer s.Close()
	s.TableName = "err_record"

	var limits []int64
	if p >= 0 && limit >= 0 {
		limits = []int64{0, limit}
		if p > 1 {
			limits[0] = (p - 1) * limit
			limits[1] = limit
		}
	}

	count, err = s.Where("monitor_id=?", []any{id}).Count()
	if err != nil {
		return data, 0, err
	}
	data, err = s.Where("monitor_id=?", []any{id}).Order("create_time", "desc").Limit(limits).Select()
	if err != nil {
		return data, 0, err
	}
	return data, int(count), nil
}

func MultiAddMonitor(monitors []*Monitor) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()

	for _, monitor := range monitors {
		data := map[string]any{
			"name":            monitor.Name,
			"target":          monitor.Target,
			"monitor_type":    monitor.MonitorType,
			"report_types":    monitor.ReportTypes,
			"cycle":           monitor.Cycle,
			"repeat_send_gap": monitor.RepeatSendGap,
			"active":          monitor.Active,
			"advance_day":     monitor.AdvanceDay,
			"create_time":     time.Now().Format("2006-01-02 15:04:05"),
			"update_time":     time.Now().Format("2006-01-02 15:04:05"),
		}
		if _, err := s.Insert(data); err != nil {
			return fmt.Errorf("添加监控记录失败: %v", err)
		}
	}
	return nil
}
