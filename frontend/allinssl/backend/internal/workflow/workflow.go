package workflow

import (
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

func GetSqlite() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "workflow"
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
		count, err = s.Where("name like ?", []interface{}{"%" + search + "%"}).Count()
		data, err = s.Where("name like ?", []interface{}{"%" + search + "%"}).Order("update_time", "desc").Limit(limits).Select()
	} else {
		count, err = s.Count()
		data, err = s.Order("update_time", "desc").Limit(limits).Select()
	}
	if err != nil {
		return data, 0, err
	}
	return data, int(count), nil
}

func AddWorkflow(name, content, execType, active, execTime string) error {
	var node WorkflowNode
	err := json.Unmarshal([]byte(content), &node)
	if err != nil {
		return fmt.Errorf("检测到工作流配置有问题：%v", err)
	}

	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = s.Insert(map[string]interface{}{
		"name":        name,
		"content":     content,
		"exec_type":   execType,
		"active":      active,
		"exec_time":   execTime,
		"create_time": now,
		"update_time": now,
	})
	if err != nil {
		return err
	}
	return nil
}

func DelWorkflow(id string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	_, err = s.Where("id=?", []interface{}{id}).Delete()
	if err != nil {
		return err
	}
	// 清理工作流历史记录
	err = CleanWorkflowHistory()
	if err != nil {
		return fmt.Errorf("清理工作流历史记录失败: %v", err)
	}
	return nil
}

func UpdDb(id string, data map[string]any) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	data["update_time"] = time.Now().Format("2006-01-02 15:04:05")
	_, err = s.Where("id=?", []interface{}{id}).Update(data)
	if err != nil {
		return err
	}
	return nil
}

func UpdWorkflow(id, name, content, execType, active, execTime string) error {
	var node WorkflowNode
	err := json.Unmarshal([]byte(content), &node)
	if err != nil {
		return fmt.Errorf("检测到工作流配置有问题：%v", err)
	}
	err = UpdDb(id, map[string]interface{}{
		"name":      name,
		"content":   content,
		"exec_type": execType,
		"active":    active,
		"exec_time": execTime,
	})
	if err != nil {
		return err
	}
	return nil
}

func UpdExecType(id, execType string) error {
	err := UpdDb(id, map[string]interface{}{
		"exec_type": execType,
	})
	if err != nil {
		return err
	}
	return nil
}

func UpdActive(id, active string) error {
	err := UpdDb(id, map[string]interface{}{
		"active": active,
	})
	if err != nil {
		return err
	}
	return nil
}

func ExecuteWorkflow(id string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	data, err := s.Where("id=?", []interface{}{id}).Select()
	if err != nil {
		return err
	}
	if len(data) == 0 {
		return fmt.Errorf("workflow not found")
	}
	if data[0]["last_run_status"] != nil && data[0]["last_run_status"].(string) == "running" {
		return fmt.Errorf("工作流正在执行中")
	}
	content := data[0]["content"].(string)

	go func(id, c string) {
		// defer wg.Done()
		// WorkflowID := strconv.FormatInt(id, 10)
		RunID, err := AddWorkflowHistory(id, "manual")
		if err != nil {
			return
		}
		ctx := NewExecutionContext(RunID)
		defer ctx.Logger.Close()
		err = RunWorkflow(c, ctx)
		if err != nil {
			fmt.Println("执行工作流失败:", err)
			SetWorkflowStatus(id, RunID, "fail")
		} else {
			SetWorkflowStatus(id, RunID, "success")
		}
	}(id, content)
	return nil
}

func SetWorkflowStatus(id, RunID, status string) {
	_ = UpdateWorkflowHistory(RunID, status)
	_ = UpdDb(id, map[string]interface{}{"last_run_status": status})
}

func resolveInputs(inputs []WorkflowNodeParams, ctx *ExecutionContext) map[string]any {
	resolved := make(map[string]any)
	for _, input := range inputs {
		if input.FromNodeID != "" {
			if val, ok := ctx.GetOutput(input.FromNodeID); ok {
				// 暂时没有新的类型可以先写死
				// switch strings.Split(strings.TrimPrefix(input.FromNodeID, "-"), "-")[0] {
				// case "apply":
				// 	input.Name = "certificate"
				// case "upload":
				// 	input.Name = "certificate"
				// }
				// resolved[input.Name] = val
				resolved["certificate"] = val
			}
		}
	}
	return resolved
}

func RunNode(node *WorkflowNode, ctx *ExecutionContext) error {
	// 获取上下文
	inputs := resolveInputs(node.Inputs, ctx)
	// 组装参数
	if node.Config == nil {
		node.Config = make(map[string]any)
	}
	for k, v := range inputs {
		node.Config[k] = v
	}
	node.Config["_runId"] = ctx.RunID
	node.Config["logger"] = ctx.Logger
	node.Config["NodeId"] = node.Id

	// 执行当前节点
	result, err := Executors(node.Type, node.Config)

	var status ExecutionStatus
	if err != nil {
		status = StatusFailed
		if node.ChildNode == nil || node.ChildNode.Type != "execute_result_branch" {
			return err
		}
	} else {
		status = StatusSuccess
	}

	ctx.SetOutput(node.Id, result, status)

	// 普通的并行
	if node.Type == "branch" {
		if len(node.ConditionNodes) > 0 {
			var wg sync.WaitGroup
			errChan := make(chan error, len(node.ConditionNodes))
			for _, branch := range node.ConditionNodes {
				if branch.ChildNode != nil {
					if branch.ChildNode.Config == nil {
						branch.ChildNode.Config = make(map[string]any)
					}
					branch.ChildNode.Config["fromNodeData"] = node.Config["fromNodeData"]
				}
				wg.Add(1)
				go func(node *WorkflowNode) {
					defer wg.Done()
					if err = RunNode(node, ctx); err != nil {
						errChan <- err
					}
				}(branch)
			}
			wg.Wait()
			close(errChan)
			for err := range errChan {
				if err != nil {
					return err
				}
			}
		}
	}
	// 条件分支
	if node.Type == "execute_result_branch" {
		//
		if len(node.ConditionNodes) > 0 {
			lastStatus := ctx.GetStatus(node.Config["fromNodeId"].(string))
			for _, branch := range node.ConditionNodes {
				if branch.Config["type"] == string(lastStatus) {
					if branch.ChildNode != nil {
						if branch.ChildNode.Config == nil {
							branch.ChildNode.Config = make(map[string]any)
						}
						fromNodeData, ok := ctx.GetOutput(node.Config["fromNodeId"].(string))
						if !ok {
							fromNodeData = nil
						}
						branch.ChildNode.Config["fromNodeData"] = fromNodeData
					}
					err := RunNode(branch, ctx)
					if err != nil {
						return fmt.Errorf("执行条件分支失败: %v", err)
					}
				}
			}
		}
	}

	if node.ChildNode != nil {
		if node.ChildNode.Config == nil {
			node.ChildNode.Config = make(map[string]any)
		}
		fromNodeData, ok := ctx.GetOutput(node.Id)
		if ok && fromNodeData != nil && node.ChildNode.Config["fromNodeData"] == nil {
			node.ChildNode.Config["fromNodeData"] = fromNodeData
		}
		return RunNode(node.ChildNode, ctx)
	}
	return nil
}

func RunWorkflow(content string, ctx *ExecutionContext) error {
	var node WorkflowNode
	err := json.Unmarshal([]byte(content), &node)
	if err != nil {
		return err
	} else {
		ctx.Logger.Info("=============开始执行=============")
		err = RunNode(&node, ctx)
		// fmt.Println(err)
		if err != nil {
			ctx.Logger.Info("=============执行失败=============")
			return err
		}
		ctx.Logger.Info("=============执行完成=============")
		return nil
	}
}
