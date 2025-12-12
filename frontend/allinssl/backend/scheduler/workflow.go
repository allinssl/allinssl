package scheduler

import (
	wf "ALLinSSL/backend/internal/workflow"
	"encoding/json"
	"fmt"
	"strconv"
	"sync"
	"time"
)

type ExecTime struct {
	Type   string `json:"type"`            // "day", "week", "month"
	Month  int    `json:"month,omitempty"` // 每月几号 type="month"时必填
	Week   int    `json:"week,omitempty"`  // 星期几 type="week"时必填
	Hour   int    `json:"hour"`            // 几点 必填
	Minute int    `json:"minute"`          // 几分 必填
}

func RunWorkflows() {
	s, err := wf.GetSqlite()
	if err != nil {
		fmt.Println(err)
		return
	}
	defer s.Close()
	data, err := s.Select()
	if err != nil {
		fmt.Println(err)
		return
	}
	now := time.Now()
	// 遍历工作流
	var wg sync.WaitGroup
	for _, workflow := range data {
		if workflow["exec_type"].(string) != "auto" {
			// fmt.Println("不是自动执行的工作流")
			continue
		}
		if workflow["active"].(int64) == 0 {
			// 1: 启用
			// 0: 禁用
			// fmt.Println("工作流未启用")
			continue
		}
		if workflow["last_run_status"] != nil && workflow["last_run_status"].(string) == "running" {
			// fmt.Println("工作流正在运行")
			continue
		}
		// if workflow["last"]
		if workflow["last_run_time"] != nil && now.Format("2006-01-02 15:04") == workflow["last_run_time"].(string)[0:16] {
			// fmt.Println("工作流已执行过")
			continue
		}
		// 判断是否到执行时间
		var execTime ExecTime
		execTimeStr := ""
		if et, ok := workflow["exec_time"].(string); ok {
			execTimeStr = et
		}
		err := json.Unmarshal([]byte(execTimeStr), &execTime)
		if err != nil {
			// fmt.Println("解析执行时间失败:", err)
			continue
		}
		if execTime.Minute != now.Minute() || execTime.Hour != now.Hour() {
			// fmt.Println("不在执行时间内1")
			continue
		}

		if execTime.Type == "week" && execTime.Week != int(now.Weekday()) {
			// fmt.Println("不在执行时间内2")
			continue
		}
		if execTime.Type == "month" && execTime.Month != now.Day() {
			// fmt.Println("不在执行时间内3")
			continue
		}
		if content, ok := workflow["content"].(string); !ok {
			// fmt.Println("工作流内容为空")
			continue
		} else {
			wg.Add(1)
			go func(id int64, c string) {
				defer wg.Done()
				WorkflowID := strconv.FormatInt(id, 10)
				RunID, err := wf.AddWorkflowHistory(WorkflowID, "auto")
				if err != nil {
					return
				}
				ctx := wf.NewExecutionContext(RunID)
				defer ctx.Logger.Close()
				err = wf.RunWorkflow(c, ctx)
				if err != nil {
					fmt.Println("执行工作流失败:", err)
					wf.SetWorkflowStatus(WorkflowID, RunID, "fail")
				} else {
					wf.SetWorkflowStatus(WorkflowID, RunID, "success")
				}
			}(workflow["id"].(int64), content)
		}
	}
	wg.Wait()
}
