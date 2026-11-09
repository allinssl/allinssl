package module

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"
)

// WorkflowRegistration 由插件后端在 /api/workflow 暴露，宿主启用或重启插件后读取。
type WorkflowRegistration struct {
	Nodes     []WorkflowNode    `json:"nodes,omitempty"`
	Overrides map[string]string `json:"overrides,omitempty"`
}

type WorkflowNode struct {
	Name    string `json:"name"`
	Handler string `json:"handler"`
	Title   string `json:"title,omitempty"`
	Order   int    `json:"order,omitempty"`
}

type WorkflowBinding struct {
	ID      string
	Node    string
	Handler string
}

var builtinWorkflowNodes = map[string]bool{
	"apply": true, "deploy": true, "upload": true, "notify": true, "private_ca": true,
}

func validateWorkflowRegistration(registration WorkflowRegistration) error {
	names := map[string]bool{}
	for _, node := range registration.Nodes {
		if !identifier.MatchString(node.Name) {
			return fmt.Errorf("工作流节点名称无效: %s", node.Name)
		}
		if node.Handler == "" {
			return fmt.Errorf("工作流节点处理器不能为空: %s", node.Name)
		}
		if names[node.Name] {
			return fmt.Errorf("工作流节点重复: %s", node.Name)
		}
		names[node.Name] = true
	}
	for target, handler := range registration.Overrides {
		if !builtinWorkflowNodes[target] {
			return fmt.Errorf("不能覆盖工作流节点: %s", target)
		}
		if handler == "" {
			return fmt.Errorf("工作流覆盖处理器不能为空: %s", target)
		}
	}
	return nil
}

func (m *Manager) loadWorkflow(item *installed) error {
	m.mu.Lock()
	item.workflow = WorkflowRegistration{}
	item.WorkflowError = ""
	p := item.proc
	m.mu.Unlock()
	if item.Backend == "" || p == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(p.ctx, 10*time.Second)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, "GET", p.url+"/api/workflow", nil)
	if err != nil {
		return err
	}
	request.Header.Set("Authorization", "Bearer "+p.token)
	response, err := m.client.Do(request)
	if err != nil {
		return fmt.Errorf("读取工作流注册表失败: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode == http.StatusNotFound {
		return nil
	}
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("读取工作流注册表失败: HTTP %d", response.StatusCode)
	}
	var registration WorkflowRegistration
	if err := json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&registration); err != nil {
		return fmt.Errorf("工作流注册表格式无效: %w", err)
	}
	if err := validateWorkflowRegistration(registration); err != nil {
		return err
	}
	m.mu.Lock()
	item.workflow = registration
	m.mu.Unlock()
	return nil
}

func (m *Manager) workflowConflict(item *installed) error {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for id, other := range m.plugins {
		if id == item.ID || !other.Enabled || !other.published {
			continue
		}
		for target := range item.workflow.Overrides {
			if other.workflow.Overrides[target] != "" {
				return fmt.Errorf("与模块 %s 重复覆盖工作流节点: %s", id, target)
			}
		}
	}
	return nil
}

// WorkflowBinding 返回节点类型对应的插件处理器；内置节点没有覆盖时返回 false。
func (m *Manager) WorkflowBinding(nodeType string) (WorkflowBinding, bool, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if strings.HasPrefix(nodeType, "plugin:") {
		parts := strings.SplitN(nodeType, ":", 3)
		if len(parts) != 3 || parts[1] == "" || parts[2] == "" {
			return WorkflowBinding{}, false, fmt.Errorf("插件工作流节点格式无效: %s", nodeType)
		}
		item := m.plugins[parts[1]]
		if item == nil || !item.Enabled || !item.published {
			return WorkflowBinding{}, false, fmt.Errorf("工作流节点所属插件不可用: %s", parts[1])
		}
		for _, node := range item.workflow.Nodes {
			if node.Name == parts[2] {
				return WorkflowBinding{ID: item.ID, Node: nodeType, Handler: node.Handler}, true, nil
			}
		}
		return WorkflowBinding{}, false, fmt.Errorf("工作流节点未注册: %s", nodeType)
	}
	if !builtinWorkflowNodes[nodeType] {
		return WorkflowBinding{}, false, nil
	}
	ids := make([]string, 0, len(m.plugins))
	for id := range m.plugins {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	for _, id := range ids {
		item := m.plugins[id]
		if !item.Enabled || !item.published {
			continue
		}
		if handler := item.workflow.Overrides[nodeType]; handler != "" {
			return WorkflowBinding{ID: item.ID, Node: nodeType, Handler: handler}, true, nil
		}
	}
	return WorkflowBinding{}, false, nil
}

// CallWorkflow 只把可传输业务参数交给插件，日志对象留在宿主进程。
func (m *Manager) CallWorkflow(ctx context.Context, binding WorkflowBinding, target string, params map[string]any) (any, error) {
	values := make(map[string]any, len(params))
	for key, value := range params {
		if key != "logger" {
			values[key] = value
		}
	}
	reply, err := m.Call(ctx, binding.ID, Invoke{Kind: "workflow", Target: target, Stage: "replace", Handler: binding.Handler, Params: values})
	if err != nil {
		return nil, err
	}
	return reply.Result, nil
}

func (m *Manager) ExecuteWorkflow(ctx context.Context, nodeType string, params map[string]any, original func(map[string]any) (any, error)) (any, error) {
	binding, ok, err := m.WorkflowBinding(nodeType)
	if err != nil {
		return nil, err
	}
	if !ok {
		return original(params)
	}
	return m.CallWorkflow(ctx, binding, nodeType, params)
}
