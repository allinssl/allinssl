package module

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var identifier = regexp.MustCompile(`^[a-z][a-z0-9_-]*$`)

// PackagePath 同时限制相对路径和符号链接，禁止包资源越过模块目录。
func PackagePath(root, name string) (string, error) {
	if name == "" || filepath.IsAbs(name) || strings.Contains(name, "\\") {
		return "", fmt.Errorf("插件路径必须为包内相对路径")
	}
	base, err := filepath.EvalSymlinks(root)
	if err != nil {
		return "", err
	}
	path, err := filepath.EvalSymlinks(filepath.Join(base, name))
	if err != nil {
		return "", err
	}
	rel, err := filepath.Rel(base, path)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", fmt.Errorf("插件路径超出包目录: %s", name)
	}
	return path, nil
}

func readManifest(root, id string) (Manifest, error) {
	var manifest Manifest
	path, err := PackagePath(root, "plugin.json")
	if err != nil {
		return manifest, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return manifest, err
	}
	if err = json.Unmarshal(data, &manifest); err != nil {
		return manifest, err
	}
	if manifest.Type != "module" || manifest.ID != id || !identifier.MatchString(id) || manifest.Protocol != 1 {
		return manifest, fmt.Errorf("模块类型、目录标识或协议版本无效，仅支持协议 1")
	}
	if manifest.Name == "" || manifest.Version == "" {
		return manifest, fmt.Errorf("模块名称和版本不能为空")
	}
	paths := []string{}
	if manifest.Backend != "" {
		paths = append(paths, manifest.Backend)
	} else if len(manifest.Hooks)+len(manifest.Permissions)+len(manifest.PublicRoutes) != 0 {
		return manifest, fmt.Errorf("纯前端模块不能声明后端扩展、业务权限或认证回调")
	} else if manifest.Frontend.Entry == "" && len(manifest.Frontend.Styles) == 0 {
		return manifest, fmt.Errorf("纯前端模块需要前端入口或样式")
	}
	if manifest.Frontend.Entry != "" {
		paths = append(paths, manifest.Frontend.Entry)
	}
	if manifest.Frontend.Login != "" {
		paths = append(paths, manifest.Frontend.Login)
	}
	paths = append(paths, manifest.Frontend.Styles...)
	frontendPaths := append([]string{}, manifest.Frontend.Styles...)
	if manifest.Frontend.Entry != "" {
		frontendPaths = append(frontendPaths, manifest.Frontend.Entry)
	}
	if manifest.Frontend.Login != "" {
		frontendPaths = append(frontendPaths, manifest.Frontend.Login)
	}
	for _, name := range frontendPaths {
		if !strings.HasPrefix(name, "frontend/") {
			return manifest, fmt.Errorf("前端资源必须位于 frontend 目录")
		}
	}
	if manifest.Frontend.Entry == "" && (len(manifest.Frontend.Pages)+len(manifest.Frontend.Slots) > 0 || manifest.Frontend.Root != "") {
		return manifest, fmt.Errorf("页面和插槽需要前端入口")
	}
	for _, name := range paths {
		path, err := PackagePath(root, name)
		if err != nil {
			return manifest, err
		}
		stat, err := os.Stat(path)
		if err != nil {
			return manifest, err
		}
		if !stat.Mode().IsRegular() {
			return manifest, fmt.Errorf("模块入口不是文件: %s", name)
		}
	}
	for _, hook := range manifest.Hooks {
		if err := validateHook(hook); err != nil {
			return manifest, err
		}
	}
	for _, route := range manifest.PublicRoutes {
		if route.Method == "" || !strings.HasPrefix(route.Path, "/v1/plugins/"+id+"/api/") || strings.Contains(route.Path, "..") {
			return manifest, fmt.Errorf("公开路由必须位于本模块 API 命名空间")
		}
	}
	for _, page := range manifest.Frontend.Pages {
		if page.Component == "" || page.Name == "" {
			return manifest, fmt.Errorf("页面名称和组件不能为空")
		}
		if page.Replace == "" && (!strings.HasPrefix(page.Name, "plugin:"+id+":") || !strings.HasPrefix(page.Path, "/plugins/"+id+"/")) {
			return manifest, fmt.Errorf("新增页面必须使用模块专属名称和路径")
		}
	}
	for _, menu := range manifest.Frontend.Menus {
		if menu.Icon != "" && manifest.Frontend.Entry == "" {
			return manifest, fmt.Errorf("菜单图标需要前端入口")
		}
	}
	return manifest, nil
}

func validateHook(hook Hook) error {
	if hook.Handler == "" {
		return fmt.Errorf("扩展处理器不能为空")
	}
	if hook.Kind == "auth" {
		if hook.Target != "request" || hook.Stage != "replace" {
			return fmt.Errorf("认证只支持 request 的 replace 扩展")
		}
		return nil
	}
	if hook.Stage != "before" && hook.Stage != "replace" && hook.Stage != "after" {
		return fmt.Errorf("扩展阶段无效")
	}
	switch hook.Kind {
	case "http":
		parts := strings.SplitN(hook.Target, " ", 2)
		if len(parts) != 2 || !strings.HasPrefix(parts[1], "/v1/") || strings.HasPrefix(parts[1], "/v1/plugins/") || strings.HasPrefix(parts[1], "/v1/login/") {
			return fmt.Errorf("只能扩展具体业务接口，不能替换管理或登录接口")
		}
		if hook.Stage == "after" && (parts[0] != "POST" || strings.HasSuffix(parts[1], "/download_data")) {
			return fmt.Errorf("响应后置扩展仅支持普通 POST 业务接口")
		}
	case "workflow":
		if !strings.Contains("|apply|deploy|upload|notify|private_ca|", "|"+hook.Target+"|") {
			return fmt.Errorf("不支持的工作流扩展: %s", hook.Target)
		}
	case "scheduler":
		if hook.Target != "monitor" && hook.Target != "workflow" {
			return fmt.Errorf("不支持的调度扩展")
		}
	default:
		return fmt.Errorf("不支持的扩展类型: %s", hook.Kind)
	}
	return nil
}
