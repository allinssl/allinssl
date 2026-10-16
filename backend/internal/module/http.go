package module

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"

	"ALLinSSL/backend/public"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// RegisterBusiness 直接记录原处理器，内部调用不经过认证或模块扩展链。
func (m *Manager) RegisterBusiness(routes gin.RoutesInfo) {
	for _, route := range routes {
		if !businessOperation(route.Method, route.Path) {
			continue
		}
		m.RegisterOperation(route.Method+" "+route.Path, businessHandler(route.Method, route.Path, route.HandlerFunc))
	}
}

func businessOperation(method, path string) bool {
	if method != "GET" && method != "POST" {
		return false
	}
	if strings.Contains(path, "get_plugin") {
		return false
	}
	if strings.HasPrefix(path, "/v1/setting/") {
		return path == "/v1/setting/get_setting" || path == "/v1/setting/save_setting"
	}
	parts := strings.Split(path, "/")
	if len(parts) != 4 || parts[1] != "v1" {
		return false
	}
	switch parts[2] {
	case "cert", "access", "acme_account", "workflow", "monitor", "report", "private_ca", "overview":
		return true
	}
	return false
}

func businessHandler(method, path string, handler gin.HandlerFunc) Operation {
	return func(ctx context.Context, params map[string]any) (*HTTPResponse, error) {
		values := url.Values{}
		for key, value := range params {
			switch item := value.(type) {
			case string:
				values.Set(key, item)
			case nil:
				continue
			default:
				data, err := json.Marshal(item)
				if err != nil {
					return nil, err
				}
				values.Set(key, string(data))
			}
		}
		request, err := http.NewRequestWithContext(ctx, method, path, strings.NewReader(values.Encode()))
		if err != nil {
			return nil, err
		}
		request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		if method == "GET" {
			request.URL.RawQuery = values.Encode()
		}
		writer := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(writer)
		c.Request = request
		handler(c)
		return &HTTPResponse{Status: writer.Code, Header: writer.Header(), Body: writer.Body.Bytes()}, nil
	}
}

func ReadRequest(request *http.Request) (*HTTPRequest, error) {
	var body []byte
	var err error
	if request.Body != nil {
		body, err = io.ReadAll(request.Body)
		request.Body = io.NopCloser(bytes.NewReader(body))
	}
	return &HTTPRequest{Method: request.Method, URL: request.URL.RequestURI(), Header: request.Header.Clone(), Body: body, Remote: request.RemoteAddr}, err
}

func writeResponse(c *gin.Context, response *HTTPResponse) {
	for key, values := range response.Header {
		c.Writer.Header()[key] = values
	}
	status := response.Status
	if status == 0 {
		status = http.StatusOK
	}
	c.Status(status)
	_, _ = c.Writer.Write(response.Body)
	c.Abort()
}

// HandleAuth 返回 true 时，宿主无需再执行内置 Session/API Key 认证。
func (m *Manager) HandleAuth(c *gin.Context) bool {
	path := c.Request.URL.Path
	authID := m.authID()
	bootstrap := path == "/v1/plugins/bootstrap" && c.Request.Method == "GET"
	loginAsset := c.Request.Method == "GET" && m.isLoginAsset(authID, path)
	if authID == "" && !bootstrap && !loginAsset {
		return false
	}
	session := sessions.Default(c)
	secure := public.Secure
	if secure != "" && secure != "/" && secure != "/login" {
		if path == secure {
			session.Set("secure", true)
			_ = session.Save()
			c.Redirect(http.StatusFound, "/login")
			c.Abort()
			return true
		}
		if session.Get("secure") != true {
			c.Data(http.StatusNotFound, "text/html; charset=utf-8", []byte("页面不存在"))
			c.Abort()
			return true
		}
	}
	if bootstrap {
		return true
	}
	if c.Request.Method == "GET" && (path == "/login" || path == "/favicon.ico" || strings.HasPrefix(path, "/static/") || loginAsset) {
		return true
	}
	if m.isPublicRoute(authID, c.Request.Method, path) {
		return true
	}
	request, err := ReadRequest(c.Request)
	if err != nil {
		public.FailMsg(c, err.Error())
		return true
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	reply, _, err := m.Authentication(ctx, request)
	if err != nil {
		public.FailMsg(c, err.Error())
		return true
	}
	if reply.Allow {
		return true
	}
	if reply.Response != nil {
		writeResponse(c, reply.Response)
		return true
	}
	c.AbortWithStatusJSON(http.StatusUnauthorized, public.Response{Code: 401, Message: "认证模块拒绝访问"})
	return true
}

func (m *Manager) isLoginAsset(id, path string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	parts := strings.SplitN(strings.TrimPrefix(path, "/plugins/"), "/static/", 2)
	if strings.HasPrefix(path, "/plugins/") && len(parts) == 2 && strings.HasPrefix(parts[1], "frontend/") {
		theme := m.plugins[parts[0]]
		if theme != nil && theme.Enabled && theme.published && theme.Backend == "" {
			return true
		}
	}
	item := m.plugins[id]
	if item == nil {
		return false
	}
	prefix := "/plugins/" + id + "/static/"
	name := strings.TrimPrefix(path, prefix)
	if name == path {
		return false
	}
	if name == item.Frontend.Login {
		return true
	}
	for _, style := range item.Frontend.Styles {
		if name == style {
			return true
		}
	}
	return false
}

func (m *Manager) isPublicRoute(id, method, path string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	item := m.plugins[id]
	if item == nil {
		return false
	}
	for _, route := range item.PublicRoutes {
		if route.Method == method && route.Path == path {
			return true
		}
	}
	return false
}

type frontendModule struct {
	ID       string   `json:"id"`
	Version  string   `json:"version"`
	Status   string   `json:"status"`
	Error    string   `json:"error,omitempty"`
	Frontend Frontend `json:"frontend"`
}

func (m *Manager) Bootstrap(c *gin.Context) {
	authID := m.authID()
	authenticated := false
	var login any
	if authID == "" {
		session := sessions.Default(c)
		authenticated = session.Get("login") == true && session.Get("__login_key") == public.LoginKey
	} else {
		request, err := ReadRequest(c.Request)
		if err != nil {
			public.FailMsg(c, err.Error())
			return
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
		defer cancel()
		reply, _, authErr := m.Authentication(ctx, request)
		authenticated = authErr == nil && reply.Allow
		m.mu.RLock()
		item := m.plugins[authID]
		login = map[string]any{"id": authID, "entry": item.Frontend.Login, "styles": item.Frontend.Styles, "status": item.Status, "error": item.Error, "version": item.Version}
		m.mu.RUnlock()
		if authErr != nil {
			login.(map[string]any)["error"] = authErr.Error()
		}
	}
	items := []frontendModule{}
	m.mu.RLock()
	for id, item := range m.plugins {
		if item.Enabled && item.published && (authenticated || item.Backend == "") {
			items = append(items, frontendModule{ID: id, Version: item.Version, Status: item.Status, Error: item.Error, Frontend: item.Frontend})
		}
	}
	m.mu.RUnlock()
	public.SuccessData(c, map[string]any{"authentication": login, "authenticated": authenticated, "modules": items}, len(items))
}

func (m *Manager) RegisterHTTP(r *gin.Engine) {
	r.GET("/v1/plugins/bootstrap", m.Bootstrap)
	r.POST("/v1/plugins/list", m.listHTTP)
	r.POST("/v1/plugins/enable", m.enableHTTP)
	r.POST("/v1/plugins/disable", m.disableHTTP)
	r.POST("/v1/plugins/restart", m.restartHTTP)
	r.Any("/v1/plugins/:id/api/*path", m.proxyHTTP)
	r.GET("/plugins/:id/static/*path", m.assetHTTP)
}

func (m *Manager) listHTTP(c *gin.Context) {
	items, err := m.List()
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, items, len(items))
}

func (m *Manager) changeHTTP(c *gin.Context, action string) {
	var form struct {
		ID string `form:"id" json:"id" binding:"required"`
	}
	if err := c.ShouldBind(&form); err != nil {
		public.FailMsg(c, "模块标识不能为空")
		return
	}
	var err error
	switch action {
	case "enable":
		err = m.Enable(form.ID)
	case "disable":
		err = m.Disable(form.ID)
	case "restart":
		err = m.Restart(form.ID)
	}
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "插件操作成功，刷新页面后加载界面变更")
}

func (m *Manager) enableHTTP(c *gin.Context)  { m.changeHTTP(c, "enable") }
func (m *Manager) disableHTTP(c *gin.Context) { m.changeHTTP(c, "disable") }
func (m *Manager) restartHTTP(c *gin.Context) { m.changeHTTP(c, "restart") }

func (m *Manager) proxyHTTP(c *gin.Context) {
	m.forwardHTTP(c, c.Param("id"), "/api"+c.Param("path"), nil)
}

// forwardHTTP 复用插件 API 通道转发原始响应，下载和持续流不经过 JSON 缓冲。
func (m *Manager) forwardHTTP(c *gin.Context, id, path string, hook *binding) {
	m.mu.RLock()
	item := m.plugins[id]
	if item == nil || !item.Enabled || item.Status != "running" || item.proc == nil {
		m.mu.RUnlock()
		public.FailMsg(c, "模块不可用")
		return
	}
	p := item.proc
	p.active.Add(1)
	m.mu.RUnlock()
	defer p.active.Done()
	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()
	stop := context.AfterFunc(p.ctx, cancel)
	defer stop()
	c.Request = c.Request.WithContext(ctx)
	address, _ := url.Parse(p.url)
	proxy := httputil.NewSingleHostReverseProxy(address)
	proxy.Transport = m.client.Transport
	proxy.FlushInterval = -1
	proxy.Director = func(r *http.Request) {
		r.URL.Scheme = address.Scheme
		r.URL.Host = address.Host
		r.URL.Path = path
		r.URL.RawPath = ""
		r.Host = address.Host
		r.Header.Set("Authorization", "Bearer "+p.token)
		r.Header.Del("Cookie")
		proto := "http"
		if c.Request.TLS != nil {
			proto = "https"
		}
		r.Header.Set("X-Forwarded-Proto", proto)
		r.Header.Del("X-Allinssl-Hook-Handler")
		r.Header.Del("X-Allinssl-Hook-Target")
		if hook != nil {
			r.Header.Set("X-Allinssl-Hook-Handler", hook.Handler)
			r.Header.Set("X-Allinssl-Hook-Target", hook.Target)
		}
	}
	proxy.ErrorHandler = func(_ http.ResponseWriter, _ *http.Request, err error) {
		public.FailMsg(c, "模块接口调用失败: "+err.Error())
	}
	proxy.ServeHTTP(c.Writer, c.Request)
	c.Abort()
}

func (m *Manager) assetHTTP(c *gin.Context) {
	id := c.Param("id")
	m.mu.RLock()
	item := m.plugins[id]
	if item == nil || !item.Enabled || !item.published {
		m.mu.RUnlock()
		c.AbortWithStatus(http.StatusNotFound)
		return
	}
	root := item.root
	m.mu.RUnlock()
	name := strings.TrimPrefix(c.Param("path"), "/")
	// 只发布前端资源，不能借静态资源入口下载插件可执行程序或包清单。
	if !strings.HasPrefix(name, "frontend/") {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}
	frontendRoot, err := PackagePath(root, "frontend")
	if err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}
	path, err := PackagePath(frontendRoot, strings.TrimPrefix(name, "frontend/"))
	if err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}
	stat, err := os.Stat(path)
	if err != nil || !stat.Mode().IsRegular() {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}
	c.Header("Cache-Control", "no-cache")
	c.File(path)
}

type responseBuffer struct {
	gin.ResponseWriter
	body   bytes.Buffer
	status int
}

func (w *responseBuffer) WriteHeader(status int)               { w.status = status }
func (w *responseBuffer) WriteHeaderNow()                      {}
func (w *responseBuffer) Write(data []byte) (int, error)       { return w.body.Write(data) }
func (w *responseBuffer) WriteString(data string) (int, error) { return w.body.WriteString(data) }
func (w *responseBuffer) Status() int                          { return w.status }
func (w *responseBuffer) Size() int                            { return w.body.Len() }
func (w *responseBuffer) Written() bool                        { return w.body.Len() > 0 }

func (m *Manager) Middleware(c *gin.Context) {
	target := c.Request.Method + " " + c.FullPath()
	before := m.bindings("http", target, "before")
	replace := m.bindings("http", target, "replace")
	after := m.bindings("http", target, "after")
	if len(before)+len(replace)+len(after) == 0 {
		return
	}
	request, err := ReadRequest(c.Request)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	for _, hook := range before {
		reply, err := m.Call(c.Request.Context(), hook.ID, Invoke{Kind: "http", Target: target, Stage: "before", Handler: hook.Handler, Request: request})
		if err != nil {
			public.FailMsg(c, err.Error())
			return
		}
		if reply.Response != nil {
			writeResponse(c, reply.Response)
			return
		}
		if reply.Request != nil {
			request = reply.Request
		}
	}
	// 路由已经匹配，只允许修改参数及请求头，不能借前置处理绕过其他接口认证。
	c.Request.Header = request.Header
	c.Request.Body = io.NopCloser(bytes.NewReader(request.Body))
	c.Request.ContentLength = int64(len(request.Body))
	c.Request.Form = nil
	c.Request.PostForm = nil
	if form := c.Request.MultipartForm; form != nil {
		defer form.RemoveAll()
		c.Request.MultipartForm = nil
	}
	parsed, err := url.ParseRequestURI(request.URL)
	if err != nil {
		public.FailMsg(c, "模块返回的请求地址无效")
		return
	}
	c.Request.URL.RawQuery = parsed.RawQuery
	var response *HTTPResponse
	if len(replace) > 0 {
		hook := replace[0]
		reply, err := m.Call(c.Request.Context(), hook.ID, Invoke{Kind: "http", Target: target, Stage: "replace", Handler: hook.Handler, Request: request})
		if err != nil {
			public.FailMsg(c, err.Error())
			return
		}
		if reply.Stream {
			if len(after) != 0 {
				public.FailMsg(c, "流式替换不能使用响应后置扩展")
				return
			}
			m.forwardHTTP(c, hook.ID, "/api/_hooks/http", &hook)
			return
		}
		if reply.Response == nil {
			public.FailMsg(c, "模块没有返回接口响应")
			return
		}
		response = reply.Response
	} else if len(after) > 0 {
		original := c.Writer
		buffer := &responseBuffer{ResponseWriter: original, status: http.StatusOK}
		c.Writer = buffer
		c.Next()
		c.Writer = original
		response = &HTTPResponse{Status: buffer.status, Header: buffer.Header().Clone(), Body: buffer.body.Bytes()}
	} else {
		return
	}
	for i := len(after) - 1; i >= 0; i-- {
		hook := after[i]
		reply, err := m.Call(c.Request.Context(), hook.ID, Invoke{Kind: "http", Target: target, Stage: "after", Handler: hook.Handler, Request: request, Response: response})
		if err != nil {
			public.FailMsg(c, err.Error())
			return
		}
		if reply.Response == nil {
			public.FailMsg(c, "模块没有返回后置响应")
			return
		}
		response = reply.Response
	}
	c.Writer.Header().Del("Content-Length")
	c.Writer.Header().Del("Content-Type")
	delete(response.Header, "Content-Length")
	writeResponse(c, response)
}
