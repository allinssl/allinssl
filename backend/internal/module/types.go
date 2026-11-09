package module

import (
	"context"
	"net/http"
)

// Manifest 是模块包的公开声明，主库业务操作和数据写入分别使用 Permissions 和 DataPermissions。
type Manifest struct {
	Type            string           `json:"type"`
	ID              string           `json:"id"`
	Name            string           `json:"name"`
	Version         string           `json:"version"`
	Protocol        int              `json:"protocol"`
	Backend         string           `json:"backend,omitempty"`
	Permissions     []string         `json:"permissions,omitempty"`
	DataPermissions []DataPermission `json:"data_permissions,omitempty"`
	Hooks           []Hook           `json:"hooks,omitempty"`
	Frontend        Frontend         `json:"frontend"`
}

// DataPermission 只授权表数据写入，不能执行建表、改表或删表。
type DataPermission struct {
	Table   string   `json:"table"`
	Actions []string `json:"actions"`
}

type Hook struct {
	Kind    string `json:"kind"`
	Target  string `json:"target"`
	Stage   string `json:"stage"`
	Handler string `json:"handler"`
}

type Frontend struct {
	Root   string   `json:"root,omitempty"`
	Entry  string   `json:"entry,omitempty"`
	Styles []string `json:"styles,omitempty"`
	Pages  []Page   `json:"pages,omitempty"`
	Menus  []Menu   `json:"menus,omitempty"`
	Slots  []Slot   `json:"slots,omitempty"`
}

type Page struct {
	Name      string `json:"name"`
	Path      string `json:"path,omitempty"`
	Title     string `json:"title,omitempty"`
	Component string `json:"component"`
	Replace   string `json:"replace,omitempty"`
}

type Menu struct {
	Key    string `json:"key"`
	Title  string `json:"title,omitempty"`
	Path   string `json:"path,omitempty"`
	Icon   string `json:"icon,omitempty"`
	Order  *int   `json:"order,omitempty"`
	Group  string `json:"group,omitempty"`
	Hidden bool   `json:"hidden,omitempty"`
}

type Slot struct {
	Target    string `json:"target"`
	Component string `json:"component"`
}

type Info struct {
	Manifest
	Enabled bool   `json:"enabled"`
	Status  string `json:"status"`
	Error   string `json:"error,omitempty"`
	// WorkflowError 记录节点注册表读取失败，不影响插件其他能力。
	WorkflowError string `json:"workflow_error,omitempty"`
}

type HTTPRequest struct {
	Method string      `json:"method"`
	URL    string      `json:"url"`
	Header http.Header `json:"headers"`
	Body   []byte      `json:"body,omitempty"`
	Remote string      `json:"remote,omitempty"`
}

type HTTPResponse struct {
	Status int         `json:"status"`
	Header http.Header `json:"headers,omitempty"`
	Body   []byte      `json:"body,omitempty"`
}

// Invoke 和 Reply 用于 /invoke，字节字段按 JSON 标准使用 base64 编码。
type Invoke struct {
	Kind     string         `json:"kind"`
	Target   string         `json:"target"`
	Stage    string         `json:"stage"`
	Handler  string         `json:"handler"`
	Request  *HTTPRequest   `json:"request,omitempty"`
	Response *HTTPResponse  `json:"response,omitempty"`
	Params   map[string]any `json:"params,omitempty"`
	Result   any            `json:"result,omitempty"`
	Error    string         `json:"error,omitempty"`
}

type Reply struct {
	Stream   bool           `json:"stream,omitempty"`
	Request  *HTTPRequest   `json:"request,omitempty"`
	Response *HTTPResponse  `json:"response,omitempty"`
	Params   map[string]any `json:"params,omitempty"`
	Result   any            `json:"result,omitempty"`
	Error    string         `json:"error,omitempty"`
}

type Operation func(context.Context, map[string]any) (*HTTPResponse, error)

// Default 由进程入口初始化，Web 重启和调度器共享同一个管理器。
var Default *Manager
