package overview

import (
	"ALLinSSL/backend/internal/cert"
	"ALLinSSL/backend/internal/workflow"
	"ALLinSSL/backend/public"
	"time"
)

func GetWorkflowCount() (map[string]any, error) {
	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		return nil, err
	}
	defer s.Close()
	workflow, err := s.Query(`select count(*) as count,
       count(case when exec_type='auto' then 1 end ) as active,
       count(case when last_run_status='fail' then 1 end ) as failure
       from workflow
`)
	if err != nil {
		return nil, err
	}
	if len(workflow) == 0 {
		return nil, nil
	}
	return workflow[0], err
}

func GetCertCount() (map[string]int, error) {
	s, err := cert.GetSqlite()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	data, err := s.Select()
	if err != nil {
		return nil, err
	}
	if len(data) == 0 {
		return nil, nil
	}
	result := map[string]int{
		"count": len(data),
		"will":  0,
		"end":   0,
	}
	for _, v := range data {
		endTimeStr, ok := v["end_time"].(string)
		if !ok {
			continue
		}
		endTime, err := time.Parse("2006-01-02 15:04:05", endTimeStr)
		if err != nil {
			continue
		}
		if endTime.Before(time.Now()) {
			result["end"]++
		} else {
			if endTime.Sub(time.Now()).Hours() < 24*30 {
				result["will"]++
			}
		}
	}
	return result, nil
}

func GetSiteMonitorCount() (map[string]any, error) {
	s, err := public.NewSqlite("data/site_monitor.db", "")
	if err != nil {
		return nil, err
	}
	defer s.Close()
	cert, err := s.Query(`select count(*) as count,
	   count(case when state='异常' then 1 end ) as exception
	   from site_monitor`)
	if err != nil {
		return nil, err
	}
	if len(cert) == 0 {
		return nil, nil
	}
	return cert[0], nil
}

func GetWorkflowHistory() ([]map[string]any, error) {
	s, err := workflow.GetSqliteObjWH()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	data, err := s.Limit([]int64{0, 3}).Order("create_time", "desc").Select()
	if err != nil {
		return nil, err
	}
	s.TableName = "workflow"
	var result []map[string]any
	for _, v := range data {
		var (
			mode  string
			name  string
			state int
		)
		switch v["status"] {
		case "success":
			state = 1
		case "fail":
			state = -1
		case "running":
			state = 0
		}
		switch v["exec_type"] {
		case "manual":
			mode = "手动"
		case "auto":
			mode = "自动"
		}
		wk, err := s.Where("id=?", []interface{}{v["workflow_id"]}).Select()
		if err != nil {
			continue
		}
		if len(wk) > 0 {
			name = wk[0]["name"].(string)
		} else {
			name = "未知"
		}
		
		result = append(result, map[string]any{
			"name":      name,
			"state":     state,
			"mode":      mode,
			"exec_time": v["create_time"],
		})
	}
	return result, nil
}

func GetOverviewData() (map[string]any, error) {
	workflowCount, err := GetWorkflowCount()
	if err != nil {
		return nil, err
	}
	certCount, err := GetCertCount()
	if err != nil {
		return nil, err
	}
	siteMonitorCount, err := GetSiteMonitorCount()
	if err != nil {
		return nil, err
	}
	workflowHistory, err := GetWorkflowHistory()
	if err != nil {
		return nil, err
	}
	result := make(map[string]any)
	result["workflow"] = workflowCount
	result["cert"] = certCount
	result["site_monitor"] = siteMonitorCount
	result["workflow_history"] = workflowHistory
	return result, nil
}
