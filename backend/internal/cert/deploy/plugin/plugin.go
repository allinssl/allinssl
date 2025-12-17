package plugin

import (
	"ALLinSSL/backend/public"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os/exec"
	"path/filepath"
)

var (
	ErrPluginNotFound = errors.New("插件未找到")
	ErrActionNotFound = errors.New("插件不支持该 action")
	pluginRegistry    = map[string]PluginMetadata{}
)

type ConfigParam struct {
	Name        string           `json:"name"`
	Type        string           `json:"type"` // 数据类型:string/number/boolean/enum
	Description string           `json:"description"`
	Required    bool             `json:"required"`
	Options     []map[string]any `json:"options,omitempty"` // 可选枚举值
}

type ActionInfo struct {
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Params      []ConfigParam `json:"params,omitempty"` // 可选参数
}

type PluginMetadata struct {
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Version     string        `json:"version"`
	Author      string        `json:"author"`
	Actions     []ActionInfo  `json:"actions"`
	Config      []ConfigParam `json:"config,omitempty"` // 可选配置
	Path        string        // 插件路径
}

type Request struct {
	Action string                 `json:"action"`
	Params map[string]interface{} `json:"params,omitempty"`
}

type Response struct {
	Status  string                 `json:"status"`
	Message string                 `json:"message"`
	Result  map[string]interface{} `json:"result"`
}

func scanPlugins(dir string) ([]PluginMetadata, error) {
	pluginRegistry = map[string]PluginMetadata{} // 清空旧的
	var plugins []PluginMetadata
	_ = filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		meta, err := getMetadata(path)
		if err != nil {
			//fmt.Println("插件无效:", path, "错误:", err)
			return nil
		}
		meta.Path = path
		plugins = append(plugins, meta)
		pluginRegistry[meta.Name] = meta
		return nil
	})
	return plugins, nil
}

func getMetadata(path string) (PluginMetadata, error) {
	req := Request{Action: "get_metadata"}
	data, _ := json.Marshal(req)

	cmd := exec.Command(path)
	cmd.Stdin = bytes.NewReader(data)
	var out bytes.Buffer
	cmd.Stdout = &out

	if err := cmd.Run(); err != nil {
		return PluginMetadata{}, fmt.Errorf("运行失败: %w", err)
	}

	var resp Response
	if err := json.Unmarshal(out.Bytes(), &resp); err != nil {
		return PluginMetadata{}, fmt.Errorf("输出无效: %w", err)
	}
	if resp.Status != "success" {
		return PluginMetadata{}, fmt.Errorf("插件响应错误: %s", resp.Message)
	}

	var meta PluginMetadata
	raw, _ := json.Marshal(resp.Result)
	if err := json.Unmarshal(raw, &meta); err != nil {
		var metaMap map[string]any
		if err := json.Unmarshal(raw, &metaMap); err == nil {

			name, ok := metaMap["name"].(string)
			if !ok || name == "" {
				return PluginMetadata{}, fmt.Errorf("元数据缺失字段: name")
			}
			meta.Name = name
			description, ok := metaMap["description"].(string)
			if !ok || description == "" {
				return PluginMetadata{}, fmt.Errorf("元数据缺失字段: description")
			}
			meta.Description = description
			version, ok := metaMap["version"].(string)
			if !ok || version == "" {
				return PluginMetadata{}, fmt.Errorf("元数据缺失字段: version")
			}
			meta.Version = version
			author, ok := metaMap["author"].(string)
			if !ok || author == "" {
				return PluginMetadata{}, fmt.Errorf("元数据缺失字段: author")
			}
			meta.Author = author

			metaMapConfig, ok := metaMap["config"].(map[string]any)
			if !ok {
				return PluginMetadata{}, fmt.Errorf("元数据缺失字段: config")
			}
			config := ConfigParam{
				Type:     "string",
				Required: true,
			}
			// 遍历 map 键值对
			for key, value := range metaMapConfig {
				config.Name = key
				config.Description = value.(string)
				meta.Config = append(meta.Config, config)
			}
			actions, ok := metaMap["actions"].([]any)
			if !ok || len(actions) == 0 {
				return PluginMetadata{}, fmt.Errorf("元数据缺失字段: actions")
			}
			for _, a := range actions {
				actionMap, ok := a.(map[string]any)
				if !ok {
					return PluginMetadata{}, fmt.Errorf("元数据 actions 格式错误")
				}
				action := ActionInfo{}
				name, ok := actionMap["name"].(string)
				if !ok || name == "" {
					return PluginMetadata{}, fmt.Errorf("元数据缺失字段: action.name")
				}
				action.Name = name
				description, ok := actionMap["description"].(string)
				if !ok || description == "" {
					return PluginMetadata{}, fmt.Errorf("元数据缺失字段: action.description")
				}
				action.Description = description

				paramsMap, ok := actionMap["params"].(map[string]any)
				if ok {
					for key, value := range paramsMap {
						param := ConfigParam{
							Name:        key,
							Type:        "string",
							Description: value.(string),
							Required:    true,
						}
						action.Params = append(action.Params, param)
					}
				}
				meta.Actions = append(meta.Actions, action)
				return meta, nil
			}
		} else {
			fmt.Println(err)
		}
		return PluginMetadata{}, fmt.Errorf("元数据解析失败: %w", err)
	}

	if meta.Name == "" || len(meta.Actions) == 0 {
		return PluginMetadata{}, fmt.Errorf("元数据缺失")
	}

	return meta, nil
}

// GetPluginRawMetadata 获取原始元数据
func GetPluginRawMetadata(name string) (map[string]interface{}, error) {
	plugin, ok := pluginRegistry[name]
	if !ok {
		return nil, ErrPluginNotFound
	}
	path := plugin.Path

	req := Request{Action: "get_metadata"}
	data, _ := json.Marshal(req)

	cmd := exec.Command(path)
	cmd.Stdin = bytes.NewReader(data)
	var out bytes.Buffer
	cmd.Stdout = &out

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("运行失败: %w", err)
	}

	var resp Response
	if err := json.Unmarshal(out.Bytes(), &resp); err != nil {
		return nil, fmt.Errorf("输出无效: %w", err)
	}
	if resp.Status != "success" {
		return nil, fmt.Errorf("插件响应错误: %s", resp.Message)
	}

	return resp.Result, nil
}

func CallPlugin(name, action string, params map[string]interface{}, logger *public.Logger) (*Response, error) {
	// 第一次尝试
	resp, err := tryCallPlugin(name, action, params, logger)
	if err == nil {
		return resp, nil
	}

	// 如果是插件或 action 不存在，则刷新插件列表并再试一次
	if errors.Is(err, ErrPluginNotFound) || errors.Is(err, ErrActionNotFound) {
		logger.Debug("插件或插件内方法不存在，尝试刷新插件列表...")
		_, scanErr := GetPlugins()
		if scanErr != nil {
			logger.Error("插件刷新失败", scanErr)
			return nil, fmt.Errorf("插件刷新失败: %v", scanErr)
		}
		return tryCallPlugin(name, action, params, logger)
	}

	// 其他错误直接返回
	return nil, err
}

func tryCallPlugin(name, action string, params map[string]interface{}, logger *public.Logger) (*Response, error) {
	plugin, ok := pluginRegistry[name]
	if !ok {
		return nil, ErrPluginNotFound
	}

	// 检查 action 是否存在
	found := false
	for _, a := range plugin.Actions {
		if a.Name == action {
			found = true
			break
		}
	}
	if !found {
		logger.Debug("插件不支持该 action", "plugin", name, "action", action)
		return nil, ErrActionNotFound
	}

	// 构造请求
	req := Request{
		Action: action,
		Params: params,
	}

	// 启动插件进程
	cmd := exec.Command(plugin.Path)
	cmd.Stderr = io.Discard // ❌ 忽略所有插件错误/日志输出，避免污染

	stdin, err := cmd.StdinPipe()
	if err != nil {
		logger.Error("开启标准输入管道失败", err)
		return nil, err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		logger.Error("开启标准输出管道失败", err)
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		logger.Error("启动插件失败", err)
		return nil, err
	}

	if err := json.NewEncoder(stdin).Encode(req); err != nil {
		logger.Error("发送插件请求失败", err)
		return nil, err
	}
	stdin.Close()

	respBytes, err := io.ReadAll(stdout)
	if err != nil {
		logger.Error("读取插件响应失败", err)
		return nil, err
	}
	var resp Response
	if err := json.Unmarshal(respBytes, &resp); err != nil {
		logger.Error("解析插件响应失败", err, "内容", string(respBytes))
		return nil, fmt.Errorf("解析插件响应失败: %v\n内容: %s", err, respBytes)
	}
	cmd.Wait()
	logger.Debug("插件响应", "plugin", name, "action", action, "response", resp)
	if resp.Status != "success" {
		return nil, fmt.Errorf("插件响应错误: %s", resp.Message)
	}

	return &resp, nil
}

func GetPlugins() ([]PluginMetadata, error) {
	pluginDir := public.GetSettingIgnoreError("plugin_dir")
	return scanPlugins(pluginDir)
}

func GetActions(pluginName string) ([]ActionInfo, error) {
	_, err := GetPlugins()
	if err != nil {
		return nil, fmt.Errorf("获取插件列表失败: %v", err)
	}
	return pluginRegistry[pluginName].Actions, err
}
