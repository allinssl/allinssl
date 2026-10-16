package module

import (
	"os"
	"path/filepath"
	"testing"
)

func TestManifestMenuIcon(t *testing.T) {
	root := t.TempDir()
	manifest := fixture(t, root, "example")
	manifest.Frontend.Menus = []Menu{{Key: "home", Icon: "MenuIcon"}}
	writeManifest(t, filepath.Join(root, "example"), manifest)
	loaded, err := readManifest(filepath.Join(root, "example"), "example")
	if err != nil {
		t.Fatal(err)
	}
	if loaded.Frontend.Menus[0].Icon != "MenuIcon" {
		t.Fatal("清单读取必须保留菜单图标组件名")
	}
}

func TestManifestValidation(t *testing.T) {
	root := t.TempDir()
	valid := fixture(t, root, "example")
	for _, tc := range []struct {
		name   string
		change func(*Manifest)
	}{
		{"协议", func(m *Manifest) { m.Protocol = 2 }},
		{"类型", func(m *Manifest) { m.Type = "deploy" }},
		{"标识", func(m *Manifest) { m.ID = "other" }},
		{"包外路径", func(m *Manifest) { m.Backend = "../backend.exe" }},
		{"管理替换", func(m *Manifest) {
			m.Hooks = []Hook{{Kind: "http", Target: "POST /v1/plugins/list", Stage: "replace", Handler: "x"}}
		}},
		{"下载后置", func(m *Manifest) {
			m.Hooks = []Hook{{Kind: "http", Target: "GET /v1/cert/download", Stage: "after", Handler: "x"}}
		}},
		{"前端目录", func(m *Manifest) { m.Frontend.Entry = "backend.exe" }},
		{"图标缺少入口", func(m *Manifest) {
			m.Frontend.Entry = ""
			m.Frontend.Menus = []Menu{{Key: "home", Icon: "MenuIcon"}}
		}},
		{"空页面组件", func(m *Manifest) { m.Frontend.Pages = []Page{{Name: "x", Replace: "plugins"}} }},
	} {
		t.Run(tc.name, func(t *testing.T) {
			manifest := valid
			tc.change(&manifest)
			writeManifest(t, filepath.Join(root, "example"), manifest)
			if _, err := readManifest(filepath.Join(root, "example"), "example"); err == nil {
				t.Fatal("应拒绝无效清单")
			}
		})
	}
	outside := filepath.Join(root, "outside.js")
	if err := os.WriteFile(outside, []byte("secret"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(root, "example", "frontend", "outside.js")); err == nil {
		if _, err := PackagePath(filepath.Join(root, "example"), "frontend/outside.js"); err == nil {
			t.Fatal("不能通过符号链接越界")
		}
	}
}
