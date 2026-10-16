package module

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"ALLinSSL/backend/public"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/memstore"
	"github.com/gin-gonic/gin"
)

func TestFrontendOnlyLifecycleAndPublicAssets(t *testing.T) {
	root, data := t.TempDir(), t.TempDir()
	manifest := fixture(t, root, "theme")
	manifest.Backend = ""
	manifest.Frontend.Root = "Root"
	manifest.Frontend.Pages = []Page{{Name: "login-theme", Replace: "login", Component: "Login"}, {Name: "layout-theme", Replace: "layout", Component: "Layout"}, {Name: "manage-theme", Replace: "plugins", Component: "Management"}}
	manifest.Frontend.Menus = []Menu{{Key: "plugins", Hidden: true}, {Key: "logout", Title: "退出主题"}}
	writeManifest(t, filepath.Join(root, "theme"), manifest)
	if err := os.Remove(filepath.Join(root, "theme", "backend.exe")); err != nil {
		t.Fatal(err)
	}
	m := testManager(t, root, data)
	if err := m.Enable("theme"); err != nil {
		t.Fatal(err)
	}
	if m.plugins["theme"].proc != nil || m.plugins["theme"].Status != "running" {
		t.Fatal("纯前端模块必须不创建进程并正常启用")
	}
	if _, err := os.Stat(filepath.Join(data, "plugins", "theme")); !os.IsNotExist(err) {
		t.Fatal("纯前端模块不应创建后端数据目录")
	}
	if err := m.Restart("theme"); err != nil {
		t.Fatal(err)
	}
	m.Close()
	m = testManager(t, root, data)
	if err := m.Start(); err != nil {
		t.Fatal(err)
	}
	if m.plugins["theme"].proc != nil || !m.plugins["theme"].published {
		t.Fatal("主服务重启应恢复纯前端扩展且不启动进程")
	}
	fixture(t, root, "private", Hook{Kind: "auth", Target: "request", Stage: "replace", Handler: "auth"})
	if err := m.Enable("private"); err != nil {
		t.Fatal(err)
	}
	secure := public.Secure
	public.Secure = "/"
	t.Cleanup(func() { public.Secure = secure })
	router := gin.New()
	router.Use(sessions.Sessions("theme-test", memstore.NewStore([]byte("theme-test-secret"))))
	router.Use(func(c *gin.Context) {
		if !m.HandleAuth(c) {
			c.AbortWithStatus(http.StatusUnauthorized)
		}
	})
	m.RegisterHTTP(router)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest("GET", "/v1/plugins/bootstrap", nil))
	var response struct {
		Data struct {
			Authenticated bool             `json:"authenticated"`
			Modules       []frontendModule `json:"modules"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.Data.Authenticated || len(response.Data.Modules) != 1 || response.Data.Modules[0].Frontend.Root != "Root" {
		t.Fatalf("匿名启动信息只应公开纯前端模块: %s", w.Body.String())
	}
	for _, path := range []string{"/plugins/theme/static/frontend/index.js", "/plugins/theme/static/plugin.json", "/plugins/theme/static/frontend/../plugin.json", "/plugins/private/static/frontend/index.js", "/v1/plugins/list"} {
		w = httptest.NewRecorder()
		router.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		if (w.Code == http.StatusOK) != (path == "/plugins/theme/static/frontend/index.js") {
			t.Fatalf("资源访问边界错误 %s: %d", path, w.Code)
		}
	}
	w = httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest("POST", "/v1/plugins/list", nil))
	if w.Code != http.StatusUnauthorized {
		t.Fatal("纯前端主题不能绕过插件管理接口认证")
	}
	if err := m.Disable("theme"); err != nil {
		t.Fatal(err)
	}
	if m.isLoginAsset("", "/plugins/theme/static/frontend/index.js") {
		t.Fatal("停用后不能匿名访问主题资源")
	}
}

func TestFrontendOnlyRestrictionsAndConflicts(t *testing.T) {
	root := t.TempDir()
	manifest := fixture(t, root, "theme")
	manifest.Backend = ""
	for _, change := range []func(*Manifest){
		func(m *Manifest) {
			m.Hooks = []Hook{{Kind: "auth", Target: "request", Stage: "replace", Handler: "auth"}}
		},
		func(m *Manifest) { m.Permissions = []string{"POST /v1/monitor/get_list"} },
		func(m *Manifest) {
			m.PublicRoutes = []PublicRoute{{Method: "POST", Path: "/v1/plugins/theme/api/login"}}
		},
		func(m *Manifest) { m.Frontend = Frontend{} },
		func(m *Manifest) { m.Frontend = Frontend{Root: "Root"} },
	} {
		invalid := manifest
		change(&invalid)
		writeManifest(t, filepath.Join(root, "theme"), invalid)
		if _, err := readManifest(filepath.Join(root, "theme"), "theme"); err == nil {
			t.Fatal("应拒绝无效的纯前端声明")
		}
	}
	manifest.Frontend.Root = "Root"
	writeManifest(t, filepath.Join(root, "theme"), manifest)
	other := fixture(t, root, "other")
	other.Backend = ""
	other.Frontend.Root = "Root"
	writeManifest(t, filepath.Join(root, "other"), other)
	m := testManager(t, root, t.TempDir())
	if err := m.Enable("theme"); err != nil {
		t.Fatal(err)
	}
	if err := m.Enable("other"); err == nil {
		t.Fatal("两个模块不能同时替换应用根组件")
	}
	if err := m.Disable("theme"); err != nil {
		t.Fatal(err)
	}
	if err := m.Enable("other"); err != nil {
		t.Fatal(err)
	}
}

func TestStylesOnlyModule(t *testing.T) {
	root := t.TempDir()
	manifest := fixture(t, root, "styles")
	manifest.Backend = ""
	manifest.Frontend = Frontend{Styles: []string{"frontend/theme.css"}}
	if err := os.WriteFile(filepath.Join(root, "styles", "frontend", "theme.css"), []byte("body { color: #123; }"), 0600); err != nil {
		t.Fatal(err)
	}
	writeManifest(t, filepath.Join(root, "styles"), manifest)
	m := testManager(t, root, t.TempDir())
	if err := m.Enable("styles"); err != nil {
		t.Fatal(err)
	}
	if m.plugins["styles"].proc != nil || m.plugins["styles"].Status != "running" {
		t.Fatal("仅 CSS 的主题必须可独立启用")
	}
}
