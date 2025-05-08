package workflow

import (
	"ALLinSSL/backend/public"
	"os"
	"path/filepath"
	"time"
)

// GetSqliteObjWH 工作流执行历史记录表对象
func GetSqliteObjWH() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		return nil, err
	}
	s.Connect()
	s.TableName = "workflow_history"
	return s, nil
}

// GetListWH 获取工作流执行历史记录列表
func GetListWH(id string, p, limit int64) ([]map[string]any, int, error) {
	var data []map[string]any
	var count int64
	s, err := GetSqliteObjWH()
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
	if id == "" {
		count, err = s.Count()
		data, err = s.Limit(limits).Order("create_time", "desc").Select()
	} else {
		count, err = s.Where("workflow_id=?", []interface{}{id}).Count()
		data, err = s.Where("workflow_id=?", []interface{}{id}).Limit(limits).Order("create_time", "desc").Select()
	}
	
	if err != nil {
		return data, 0, err
	}
	return data, int(count), nil
}

// 添加工作流执行历史记录
func AddWorkflowHistory(workflowID, execType string) (string, error) {
	s, err := GetSqliteObjWH()
	if err != nil {
		return "", err
	}
	defer s.Close()
	now := time.Now().Format("2006-01-02 15:04:05")
	ID := public.GenerateUUID()
	_, err = s.Insert(map[string]interface{}{
		"id":          ID,
		"workflow_id": workflowID,
		"status":      "running",
		"exec_type":   execType,
		"create_time": now,
	})
	if err != nil {
		return "", err
	}
	_ = UpdDb(workflowID, map[string]interface{}{"last_run_status": "running", "last_run_time": now})
	return ID, nil
}

// 工作流执行结束
func UpdateWorkflowHistory(id, status string) error {
	s, err := GetSqliteObjWH()
	if err != nil {
		return err
	}
	defer s.Close()
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = s.Where("id=?", []interface{}{id}).Update(map[string]interface{}{
		"status":   status,
		"end_time": now,
	})
	if err != nil {
		return err
	}
	return nil
}

func StopWorkflow(id string) error {
	s, err := GetSqliteObjWH()
	if err != nil {
		return err
	}
	defer s.Close()
	data, err := s.Where("id=?", []interface{}{id}).Select()
	if err != nil {
		return err
	}
	if len(data) == 0 {
		return nil
	}
	SetWorkflowStatus(data[0]["workflow_id"].(string), id, "fail")
	return nil
}

func GetExecLog(id string) (string, error) {
	log, err := os.ReadFile(filepath.Join(public.GetSettingIgnoreError("workflow_log_path"), id+".log"))
	if err != nil {
		return "", err
	}
	return string(log), nil
}
