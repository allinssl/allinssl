package module

import (
	"ALLinSSL/backend/public"
	"context"
	"fmt"
	"sort"
)

type binding struct {
	ID string
	Hook
}

func (m *Manager) bindings(kind, target, stage string) []binding {
	m.mu.RLock()
	defer m.mu.RUnlock()
	items := []binding{}
	for id, plugin := range m.plugins {
		if !plugin.Enabled || !plugin.published {
			continue
		}
		items = append(items, matchHooks(id, plugin.Hooks, kind, target, stage)...)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	return items
}

func matchHooks(id string, hooks []Hook, kind, target, stage string) []binding {
	var result []binding
	for _, hook := range hooks {
		if hook.Kind == kind && hook.Target == target && hook.Stage == stage {
			result = append(result, binding{ID: id, Hook: hook})
		}
	}
	return result
}

// Execute 保留宿主日志等进程内参数，只把可传输的业务参数交给模块。
func (m *Manager) Execute(ctx context.Context, kind, target string, params map[string]any, original func(map[string]any) (any, error)) (result any, executionErr error) {
	before := m.bindings(kind, target, "before")
	replace := m.bindings(kind, target, "replace")
	after := m.bindings(kind, target, "after")
	if len(before)+len(replace)+len(after) == 0 {
		return original(params)
	}
	if logger, ok := params["logger"].(*public.Logger); ok {
		logger.Info("开始执行模块扩展", "类型", kind, "目标", target)
		defer func() {
			if executionErr != nil {
				logger.Error("模块扩展执行失败", executionErr)
				return
			}
			logger.Info("模块扩展执行完成", "类型", kind, "目标", target)
		}()
	}
	values := make(map[string]any, len(params))
	for key, value := range params {
		if key != "logger" {
			values[key] = value
		}
	}
	for _, hook := range before {
		reply, err := m.Call(ctx, hook.ID, Invoke{Kind: kind, Target: target, Stage: "before", Handler: hook.Handler, Params: values})
		if err != nil {
			return nil, err
		}
		if reply.Params != nil {
			values = reply.Params
		}
	}
	var err error
	if len(replace) > 0 {
		hook := replace[0]
		var reply Reply
		reply, err = m.Call(ctx, hook.ID, Invoke{Kind: kind, Target: target, Stage: "replace", Handler: hook.Handler, Params: values})
		result = reply.Result
	} else {
		if logger, exists := params["logger"]; exists {
			values["logger"] = logger
		}
		result, err = original(values)
		delete(values, "logger")
	}
	// 已产生副作用的失败不再执行其他处理器，避免掩盖原始错误或重复写入。
	if err != nil {
		return result, err
	}
	for i := len(after) - 1; i >= 0; i-- {
		hook := after[i]
		reply, callErr := m.Call(ctx, hook.ID, Invoke{Kind: kind, Target: target, Stage: "after", Handler: hook.Handler, Params: values, Result: result})
		if callErr != nil {
			return nil, callErr
		}
		result = reply.Result
	}
	return result, nil
}

func (m *Manager) authID() string {
	hooks := m.bindings("auth", "request", "replace")
	if len(hooks) == 0 {
		return ""
	}
	return hooks[0].ID
}

func (m *Manager) Authentication(ctx context.Context, request *HTTPRequest) (Reply, bool, error) {
	hooks := m.bindings("auth", "request", "replace")
	if len(hooks) == 0 {
		return Reply{}, false, nil
	}
	if len(hooks) != 1 {
		return Reply{}, true, fmt.Errorf("认证模块配置冲突")
	}
	hook := hooks[0]
	reply, err := m.Call(ctx, hook.ID, Invoke{Kind: "auth", Target: "request", Stage: "replace", Handler: hook.Handler, Request: request})
	return reply, true, err
}
