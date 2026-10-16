package module

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"ALLinSSL/backend/public"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/memstore"
	"github.com/gin-gonic/gin"
)

func TestMain(m *testing.M) {
	if os.Getenv("ALLINSSL_MODULE_TEST_HELPER") == "1" {
		runHelper()
		return
	}
	gin.SetMode(gin.TestMode)
	os.Exit(m.Run())
}

func runHelper() {
	if os.Getenv("ALLINSSL_MODULE_TEST_FAIL_START") == "1" {
		os.Exit(1)
	}
	if gate := os.Getenv("ALLINSSL_MODULE_TEST_READY_URL"); gate != "" {
		response, err := http.Get(gate)
		if err != nil {
			os.Exit(1)
		}
		response.Body.Close()
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		os.Exit(1)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/invoke", helperInvoke)
	mux.HandleFunc("/api/echo", func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer "+os.Getenv("ALLINSSL_MODULE_TOKEN") {
			w.WriteHeader(401)
			return
		}
		w.Header().Set("Content-Type", "application/octet-stream")
		_, _ = io.Copy(w, r.Body)
	})
	server := &http.Server{Handler: mux}
	go func() { _, _ = io.Copy(io.Discard, os.Stdin); _ = server.Close() }()
	_ = json.NewEncoder(os.Stdout).Encode(map[string]any{"protocol": 1, "url": "http://" + listener.Addr().String()})
	_ = server.Serve(listener)
}

func helperInvoke(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("Authorization") != "Bearer "+os.Getenv("ALLINSSL_MODULE_TOKEN") {
		w.WriteHeader(401)
		return
	}
	var call Invoke
	if err := json.NewDecoder(r.Body).Decode(&call); err != nil {
		w.WriteHeader(400)
		return
	}
	var reply Reply
	switch call.Handler {
	case "crash":
		os.Exit(2)
	case "wait":
		time.Sleep(150 * time.Millisecond)
		reply.Result = "已完成"
	case "auth":
		reply.Allow = call.Request.Header.Get("X-Test-Login") == "yes"
	case "before":
		call.Params["order"] = fmt.Sprint(call.Params["order"]) + os.Getenv("ALLINSSL_MODULE_ID")
		reply.Params = call.Params
	case "replace":
		reply.Result = call.Params
	case "after":
		reply.Result = fmt.Sprint(call.Result) + os.Getenv("ALLINSSL_MODULE_ID")
	case "http_before":
		call.Request.Body = []byte("value=changed")
		reply.Request = call.Request
	case "http_order":
		call.Request.Header.Add("X-Test-Order", os.Getenv("ALLINSSL_MODULE_ID"))
		reply.Request = call.Request
	case "http_after":
		call.Response.Body = append(call.Response.Body, []byte(os.Getenv("ALLINSSL_MODULE_ID"))...)
		reply.Response = call.Response
	case "http_replace":
		reply.Response = &HTTPResponse{Status: 201, Body: []byte("插件响应")}
	case "fail":
		reply.Error = "测试失败"
	default:
		reply.Result = call.Params
	}
	_ = json.NewEncoder(w).Encode(reply)
}

func fixture(t *testing.T, root, id string, hooks ...Hook) Manifest {
	t.Helper()
	dir := filepath.Join(root, id)
	if err := os.MkdirAll(filepath.Join(dir, "frontend"), 0700); err != nil {
		t.Fatal(err)
	}
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(executable)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "backend.exe"), data, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "frontend", "index.js"), []byte("export default () => ({})"), 0600); err != nil {
		t.Fatal(err)
	}
	manifest := Manifest{Type: "module", ID: id, Name: id, Version: "1", Protocol: 1, Backend: "backend.exe", Hooks: hooks, Frontend: Frontend{Entry: "frontend/index.js"}}
	writeManifest(t, dir, manifest)
	return manifest
}

func writeManifest(t *testing.T, dir string, manifest Manifest) {
	t.Helper()
	data, err := json.Marshal(manifest)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "plugin.json"), data, 0600); err != nil {
		t.Fatal(err)
	}
}

func testManager(t *testing.T, root, data string) *Manager {
	t.Helper()
	t.Setenv("ALLINSSL_MODULE_TEST_HELPER", "1")
	m, err := New(root, data)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(m.Close)
	return m
}

func TestLifecyclePermissionsAndRecovery(t *testing.T) {
	root, data := t.TempDir(), t.TempDir()
	manifest := fixture(t, root, "example", Hook{Kind: "workflow", Target: "notify", Stage: "replace", Handler: "replace"})
	manifest.Permissions = []string{"POST /v1/monitor/get_list"}
	writeManifest(t, filepath.Join(root, "example"), manifest)
	m := testManager(t, root, data)
	var calls atomic.Int64
	m.RegisterOperation(manifest.Permissions[0], func(_ context.Context, params map[string]any) (*HTTPResponse, error) {
		calls.Add(1)
		return &HTTPResponse{Status: 200, Body: []byte(`{"status":true}`)}, nil
	})
	if err := m.Start(); err != nil {
		t.Fatal(err)
	}
	items, err := m.List()
	if err != nil || len(items) != 1 || items[0].Enabled {
		t.Fatalf("新模块应默认停用: %+v %v", items, err)
	}
	if err := m.Enable("example"); err != nil {
		t.Fatal(err)
	}
	pid := m.plugins["example"].proc.cmd.Process.Pid
	if err := m.Enable("example"); err == nil {
		t.Fatal("重复启用应拒绝")
	}
	if m.plugins["example"].proc.cmd.Process.Pid != pid {
		t.Fatal("不应重复启动")
	}
	ctx := context.Background()
	result, err := m.Execute(ctx, "workflow", "notify", map[string]any{"value": "ok", "logger": make(chan bool)}, func(_ map[string]any) (any, error) { t.Fatal("不能执行原实现"); return nil, nil })
	if err != nil || result.(map[string]any)["value"] != "ok" {
		t.Fatalf("替换失败: %v %v", result, err)
	}
	p := m.plugins["example"].proc
	for _, tc := range []struct {
		token, operation string
		code             int
	}{
		{"wrong", manifest.Permissions[0], 401}, {p.token, manifest.Permissions[0], 200},
		{p.token, "SQL CREATE TABLE x(id)", 403}, {p.token, "POST /v1/setting/upload_data", 403}, {p.token, "POST /v1/monitor/add_monitor", 403},
	} {
		body := fmt.Sprintf(`{"operation":%q,"params":{}}`, tc.operation)
		req, _ := http.NewRequest("POST", m.hostURL+"/call", strings.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+tc.token)
		resp, err := m.client.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if resp.StatusCode != tc.code {
			t.Fatalf("权限响应 %s: %d", tc.operation, resp.StatusCode)
		}
	}
	if calls.Load() != 1 {
		t.Fatal("未授权请求不能执行原处理器")
	}
	if err := m.Restart("example"); err != nil {
		t.Fatal(err)
	}
	if m.plugins["example"].proc.token == p.token {
		t.Fatal("重启必须更新凭据")
	}
	if err := m.Disable("example"); err != nil {
		t.Fatal(err)
	}
	result, err = m.Execute(ctx, "workflow", "notify", nil, func(_ map[string]any) (any, error) { return "原实现", nil })
	if err != nil || result != "原实现" {
		t.Fatal("停用后应恢复原实现")
	}
	if err := m.Enable("example"); err != nil {
		t.Fatal(err)
	}
	if err := DisableOnDisk(data, "example"); err != nil {
		t.Fatal(err)
	}
	next := testManager(t, root, data)
	next.RegisterOperation(manifest.Permissions[0], m.operations[manifest.Permissions[0]])
	if err := next.Start(); err != nil {
		t.Fatal(err)
	}
	if next.plugins["example"].Enabled {
		t.Fatal("本机停用应在重启后生效")
	}
}

func TestHookOrderConflictCrashAndDrain(t *testing.T) {
	root := t.TempDir()
	fixture(t, root, "alpha", Hook{Kind: "workflow", Target: "notify", Stage: "before", Handler: "before"}, Hook{Kind: "workflow", Target: "notify", Stage: "after", Handler: "after"})
	fixture(t, root, "beta", Hook{Kind: "workflow", Target: "notify", Stage: "before", Handler: "before"}, Hook{Kind: "workflow", Target: "notify", Stage: "after", Handler: "after"})
	m := testManager(t, root, t.TempDir())
	if err := m.Enable("beta"); err != nil {
		t.Fatal(err)
	}
	if err := m.Enable("alpha"); err != nil {
		t.Fatal(err)
	}
	result, err := m.Execute(context.Background(), "workflow", "notify", map[string]any{"order": ""}, func(params map[string]any) (any, error) { return params["order"], nil })
	if err != nil || result != "alphabeta"+"betaalpha" {
		t.Fatalf("扩展顺序错误: %v %v", result, err)
	}
	fixture(t, root, "replace", Hook{Kind: "workflow", Target: "apply", Stage: "replace", Handler: "replace"})
	fixture(t, root, "conflict", Hook{Kind: "workflow", Target: "apply", Stage: "replace", Handler: "replace"})
	if err := m.Enable("replace"); err != nil {
		t.Fatal(err)
	}
	if err := m.Enable("conflict"); err == nil {
		t.Fatal("应拒绝替换冲突")
	}
	var wg sync.WaitGroup
	for range 6 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := m.Call(context.Background(), "alpha", Invoke{Handler: "wait"})
			if err != nil {
				t.Errorf("并发调用失败: %v", err)
			}
		}()
	}
	time.Sleep(40 * time.Millisecond)
	if err := m.Disable("alpha"); err != nil {
		t.Fatal(err)
	}
	wg.Wait()
	if _, err := m.Call(context.Background(), "replace", Invoke{Handler: "crash"}); err == nil {
		t.Fatal("进程崩溃应报错")
	}
	_, err = m.Execute(context.Background(), "workflow", "apply", nil, func(_ map[string]any) (any, error) { t.Fatal("崩溃不能回退"); return nil, nil })
	if err == nil {
		t.Fatal("崩溃后应继续报错")
	}
}

func TestMissingAuthenticationFailsClosed(t *testing.T) {
	root, data := t.TempDir(), t.TempDir()
	fixture(t, root, "auth", Hook{Kind: "auth", Target: "request", Stage: "replace", Handler: "auth"})
	m := testManager(t, root, data)
	if err := m.Enable("auth"); err != nil {
		t.Fatal(err)
	}
	if _, active, err := m.Authentication(context.Background(), &HTTPRequest{Header: http.Header{"X-Test-Login": {"yes"}}}); !active || err != nil {
		t.Fatal(err)
	}
	m.Close()
	// 关闭一次后不再通过清理重复关闭，Close 本身应可安全重入。
	if err := os.Remove(filepath.Join(root, "auth", "plugin.json")); err != nil {
		t.Fatal(err)
	}
	next := testManager(t, root, data)
	if err := next.Start(); err != nil {
		t.Fatal(err)
	}
	if _, active, err := next.Authentication(context.Background(), &HTTPRequest{}); !active || err == nil {
		t.Fatal("认证模块缺失时不能恢复内置认证")
	}
	if err := next.Disable("auth"); err != nil {
		t.Fatal(err)
	}
	if _, active, _ := next.Authentication(context.Background(), &HTTPRequest{}); active {
		t.Fatal("手动停用后应恢复内置认证")
	}
}

func TestHTTPHooksAndHostCallsBypassHooks(t *testing.T) {
	root := t.TempDir()
	target := "POST /v1/monitor/get_list"
	manifest := fixture(t, root, "http", Hook{Kind: "http", Target: target, Stage: "before", Handler: "http_before"}, Hook{Kind: "http", Target: target, Stage: "after", Handler: "http_after"})
	manifest.Permissions = []string{target}
	writeManifest(t, filepath.Join(root, "http"), manifest)
	m := testManager(t, root, t.TempDir())
	router := gin.New()
	router.Use(m.Middleware)
	router.POST("/v1/monitor/get_list", func(c *gin.Context) { c.String(200, c.PostForm("value")); c.Abort() })
	m.RegisterBusiness(router.Routes())
	if err := m.Enable("http"); err != nil {
		t.Fatal(err)
	}
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/v1/monitor/get_list", strings.NewReader("value=original"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	router.ServeHTTP(w, req)
	if w.Code != 200 || w.Body.String() != "changedhttp" {
		t.Fatalf("接口扩展失败: %d %s", w.Code, w.Body.String())
	}
	response, err := m.operations[target](context.Background(), map[string]any{"value": "原始业务"})
	if err != nil || string(response.Body) != "原始业务" {
		t.Fatalf("内部调用不应再次进入扩展: %v %v", response, err)
	}
}

func TestHTTPOrderTerminationAndFailure(t *testing.T) {
	root := t.TempDir()
	target := "POST /v1/monitor/get_list"
	for _, id := range []string{"beta", "alpha"} {
		fixture(t, root, id, Hook{Kind: "http", Target: target, Stage: "before", Handler: "http_order"}, Hook{Kind: "http", Target: target, Stage: "after", Handler: "http_after"})
	}
	m := testManager(t, root, t.TempDir())
	router := gin.New()
	router.Use(m.Middleware)
	var calls int
	router.POST("/v1/monitor/get_list", func(c *gin.Context) {
		calls++
		c.String(200, strings.Join(c.Request.Header.Values("X-Test-Order"), ","))
	})
	m.RegisterBusiness(router.Routes())
	for _, id := range []string{"beta", "alpha"} {
		if err := m.Enable(id); err != nil {
			t.Fatal(err)
		}
	}
	w := httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest("POST", "/v1/monitor/get_list", nil))
	if w.Body.String() != "alpha,betabetaalpha" || calls != 1 {
		t.Fatalf("前置应正序、后置应逆序且原业务仅执行一次: %s，次数 %d", w.Body.String(), calls)
	}
	for _, handler := range []string{"http_replace", "fail"} {
		fixture(t, root, "abort", Hook{Kind: "http", Target: target, Stage: "before", Handler: handler})
		if err := m.Enable("abort"); err != nil {
			t.Fatal(err)
		}
		w = httptest.NewRecorder()
		router.ServeHTTP(w, httptest.NewRequest("POST", "/v1/monitor/get_list", nil))
		if calls != 1 || (handler == "http_replace" && w.Body.String() != "插件响应") || (handler == "fail" && !strings.Contains(w.Body.String(), "测试失败")) {
			t.Fatalf("前置终止或失败后不能执行原业务或后置: %s，次数 %d", w.Body.String(), calls)
		}
		if err := m.Disable("abort"); err != nil {
			t.Fatal(err)
		}
	}
}

func TestWorkflowAndSchedulerReplacementTargets(t *testing.T) {
	root := t.TempDir()
	hooks := []Hook{}
	for _, target := range []string{"apply", "deploy", "upload", "notify", "private_ca"} {
		hooks = append(hooks, Hook{Kind: "workflow", Target: target, Stage: "replace", Handler: "replace"})
	}
	for _, target := range []string{"monitor", "workflow"} {
		hooks = append(hooks, Hook{Kind: "scheduler", Target: target, Stage: "replace", Handler: "replace"})
	}
	fixture(t, root, "targets", hooks...)
	m := testManager(t, root, t.TempDir())
	if err := m.Enable("targets"); err != nil {
		t.Fatal(err)
	}
	for _, hook := range hooks {
		result, err := m.Execute(context.Background(), hook.Kind, hook.Target, map[string]any{"_runId": "验收执行", "NodeId": hook.Target, "logger": make(chan bool)}, func(map[string]any) (any, error) {
			t.Fatal("接管时不能调用原实现")
			return nil, nil
		})
		if err != nil {
			t.Fatal(err)
		}
		values := result.(map[string]any)
		if values["_runId"] != "验收执行" || values["NodeId"] != hook.Target || values["logger"] != nil {
			t.Fatalf("%s/%s 的业务参数或进程内资源过滤错误: %v", hook.Kind, hook.Target, values)
		}
	}
}

func TestBootstrapAuthenticationAndAssetBoundary(t *testing.T) {
	root := t.TempDir()
	manifest := fixture(t, root, "auth", Hook{Kind: "auth", Target: "request", Stage: "replace", Handler: "auth"})
	manifest.Frontend.Login = manifest.Frontend.Entry
	manifest.Permissions = []string{"POST /v1/monitor/get_list"}
	writeManifest(t, filepath.Join(root, "auth"), manifest)
	m := testManager(t, root, t.TempDir())
	m.RegisterOperation(manifest.Permissions[0], func(context.Context, map[string]any) (*HTTPResponse, error) { return nil, nil })
	if err := m.Enable("auth"); err != nil {
		t.Fatal(err)
	}
	secure := public.Secure
	public.Secure = ""
	t.Cleanup(func() { public.Secure = secure })
	router := gin.New()
	router.Use(sessions.Sessions("test", memstore.NewStore([]byte("test-secret"))))
	router.Use(func(c *gin.Context) { _ = m.HandleAuth(c) })
	m.RegisterHTTP(router)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest("GET", "/v1/plugins/bootstrap", nil))
	if w.Code != 200 || strings.Contains(w.Body.String(), "permissions") || strings.Contains(w.Body.String(), "backend") || strings.Contains(w.Body.String(), "MODULE_TOKEN") {
		t.Fatalf("启动信息泄露私有清单: %s", w.Body.String())
	}
	w = httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest("POST", "/v1/plugins/list", nil))
	if w.Code != 401 {
		t.Fatalf("管理接口必须认证: %d", w.Code)
	}
	for _, path := range []string{"/plugins/auth/static/plugin.json", "/plugins/auth/static/backend.exe", "/plugins/auth/static/frontend/../../../plugins.json"} {
		w = httptest.NewRecorder()
		req := httptest.NewRequest("GET", path, nil)
		req.Header.Set("X-Test-Login", "yes")
		router.ServeHTTP(w, req)
		if w.Code == 200 {
			t.Fatalf("不应暴露文件: %s", path)
		}
	}
	w = httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest("GET", "/plugins/auth/static/frontend/index.js", nil))
	if w.Code != 200 {
		t.Fatalf("登录资源应可公开加载: %d", w.Code)
	}
}

func TestAuthenticationPublication(t *testing.T) {
	for _, tc := range []struct {
		status                     string
		enabled, published, active bool
	}{
		{"starting", true, false, false},
		{"error", false, false, false},
		{"starting", true, true, true},
		{"stopping", true, true, true},
		{"error", true, true, true},
		{"disabled", false, false, false},
	} {
		item := &installed{Info: Info{Manifest: Manifest{ID: "auth", Hooks: []Hook{{Kind: "auth", Target: "request", Stage: "replace", Handler: "auth"}}}, Enabled: tc.enabled, Status: tc.status}, published: tc.published}
		m := &Manager{plugins: map[string]*installed{"auth": item}}
		_, active, err := m.Authentication(context.Background(), &HTTPRequest{})
		if active != tc.active || (active && err == nil) {
			t.Fatalf("接管状态错误: %+v active=%v err=%v", tc, active, err)
		}
	}
}

func TestAuthenticationRestartKeepsPublishedClaims(t *testing.T) {
	root := t.TempDir()
	manifest := fixture(t, root, "auth", Hook{Kind: "auth", Target: "request", Stage: "replace", Handler: "auth"})
	manifest.Permissions = []string{"POST /v1/monitor/get_list"}
	writeManifest(t, filepath.Join(root, "auth"), manifest)
	m := testManager(t, root, t.TempDir())
	m.RegisterOperation(manifest.Permissions[0], func(context.Context, map[string]any) (*HTTPResponse, error) { return &HTTPResponse{Status: 200}, nil })
	if err := m.Enable("auth"); err != nil {
		t.Fatal(err)
	}
	oldToken := m.plugins["auth"].proc.token
	state, err := os.ReadFile(m.stateFile)
	if err != nil {
		t.Fatal(err)
	}
	entered, release := make(chan struct{}), make(chan struct{})
	gate := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		close(entered)
		select {
		case <-release:
		case <-r.Context().Done():
		}
	}))
	t.Cleanup(gate.Close)
	finish := sync.OnceFunc(func() { close(release) })
	t.Cleanup(finish)
	t.Setenv("ALLINSSL_MODULE_TEST_READY_URL", gate.URL)
	done := make(chan error, 1)
	go func() { done <- m.Restart("auth") }()
	select {
	case <-entered:
	case <-time.After(10 * time.Second):
		t.Fatal("重启未进入启动阶段")
	}
	if m.actions.TryLock() {
		m.actions.Unlock()
		t.Fatal("重启必须全程持有生命周期锁")
	}
	if _, active, err := m.Authentication(context.Background(), &HTTPRequest{}); !active || err == nil {
		t.Fatal("重启启动期间不能恢复内置认证")
	}
	finish()
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	newToken := m.plugins["auth"].proc.token
	if oldToken == newToken {
		t.Fatal("重启必须轮换凭据")
	}
	for _, tc := range []struct {
		token string
		code  int
	}{{oldToken, 401}, {newToken, 200}} {
		request := httptest.NewRequest("POST", "/call", strings.NewReader(fmt.Sprintf(`{"operation":%q,"params":{}}`, manifest.Permissions[0])))
		request.Header.Set("Authorization", "Bearer "+tc.token)
		response := httptest.NewRecorder()
		m.serveOperation(response, request)
		if response.Code != tc.code {
			t.Fatalf("凭据轮换后的响应错误: %d，期望 %d", response.Code, tc.code)
		}
	}
	t.Setenv("ALLINSSL_MODULE_TEST_READY_URL", "")
	t.Setenv("ALLINSSL_MODULE_TEST_FAIL_START", "1")
	if err := m.Restart("auth"); err == nil {
		t.Fatal("启动失败必须报错")
	}
	if _, active, err := m.Authentication(context.Background(), &HTTPRequest{}); !active || err == nil {
		t.Fatal("故障重启不能恢复内置认证")
	}
	t.Setenv("ALLINSSL_MODULE_TEST_FAIL_START", "0")
	manifest.Hooks = nil
	manifest.Version = "2"
	writeManifest(t, filepath.Join(root, "auth"), manifest)
	if err := m.Restart("auth"); err == nil {
		t.Fatal("重启不能接纳修改后的清单")
	}
	if _, active, err := m.Authentication(context.Background(), &HTTPRequest{}); !active || err == nil {
		t.Fatal("清单变化后必须保留原认证接管")
	}
	current, err := os.ReadFile(m.stateFile)
	if err != nil || string(current) != string(state) || !m.plugins["auth"].Enabled || !m.plugins["auth"].published {
		t.Fatalf("重启不得改变启用状态及持久化清单: %s %v", current, err)
	}
}

func TestCloseDrainsHostOperations(t *testing.T) {
	root := t.TempDir()
	manifest := fixture(t, root, "drain")
	manifest.Permissions = []string{"POST /v1/monitor/get_list"}
	writeManifest(t, filepath.Join(root, "drain"), manifest)
	m := testManager(t, root, t.TempDir())
	entered, release := make(chan struct{}), make(chan struct{})
	finish := sync.OnceFunc(func() { close(release) })
	t.Cleanup(finish)
	m.RegisterOperation(manifest.Permissions[0], func(ctx context.Context, _ map[string]any) (*HTTPResponse, error) {
		close(entered)
		select {
		case <-release:
			return &HTTPResponse{Status: 200}, nil
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	})
	if err := m.Enable("drain"); err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest("POST", "/call", strings.NewReader(fmt.Sprintf(`{"operation":%q,"params":{}}`, manifest.Permissions[0])))
	request.Header.Set("Authorization", "Bearer "+m.plugins["drain"].proc.token)
	response := httptest.NewRecorder()
	called, closed := make(chan struct{}), make(chan struct{})
	go func() { m.serveOperation(response, request); close(called) }()
	<-entered
	go func() { m.Close(); close(closed) }()
	select {
	case <-closed:
		t.Fatal("关闭必须等待已接受的业务排空")
	case <-time.After(100 * time.Millisecond):
	}
	finish()
	<-called
	<-closed
	if response.Code != 200 {
		t.Fatalf("排空期间业务应成功完成: %d", response.Code)
	}
	m.Close()
	if m.Enable("drain") == nil || m.Restart("drain") == nil || m.Start() == nil {
		t.Fatal("关闭后不能重新启动进程")
	}
}

func TestHostOperationCancelledWithProcess(t *testing.T) {
	m := testManager(t, t.TempDir(), t.TempDir())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	m.plugins["cancel"] = &installed{Info: Info{Manifest: Manifest{Permissions: []string{"test"}}, Enabled: true, Status: "running"}, proc: &process{ctx: ctx, token: "test"}}
	t.Cleanup(func() { m.plugins["cancel"].proc = nil })
	entered := make(chan struct{})
	m.RegisterOperation("test", func(ctx context.Context, _ map[string]any) (*HTTPResponse, error) {
		close(entered)
		<-ctx.Done()
		return nil, ctx.Err()
	})
	request := httptest.NewRequest("POST", "/call", strings.NewReader(`{"operation":"test"}`))
	request.Header.Set("Authorization", "Bearer test")
	response := httptest.NewRecorder()
	done := make(chan struct{})
	go func() { m.serveOperation(response, request); close(done) }()
	<-entered
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("插件进程结束后宿主业务未取消")
	}
	if response.Code != 500 {
		t.Fatalf("取消的业务应返回失败: %d", response.Code)
	}
}
