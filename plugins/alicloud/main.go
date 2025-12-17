package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"os"
)

//go:embed metadata.json
var metadataJSON []byte

var pluginMeta map[string]interface{}

func init() {
	if err := json.Unmarshal(metadataJSON, &pluginMeta); err != nil {
		panic(fmt.Sprintf("解析元数据失败: %v", err))
	}
}

type Request struct {
	Action string                 `json:"action"`
	Params map[string]interface{} `json:"params"`
}

type Response struct {
	Status  string                 `json:"status"`
	Message string                 `json:"message"`
	Result  map[string]interface{} `json:"result"`
}

func outputJSON(resp *Response) {
	_ = json.NewEncoder(os.Stdout).Encode(resp)
}

func outputError(msg string, err error) {
	outputJSON(&Response{
		Status:  "error",
		Message: fmt.Sprintf("%s: %v", msg, err),
	})
}

func main() {
	var req Request
	input, err := io.ReadAll(os.Stdin)
	if err != nil {
		outputError("读取输入失败", err)
		return
	}
	if err := json.Unmarshal(input, &req); err != nil {
		outputError("解析请求失败", err)
		return
	}
	switch req.Action {
	case "get_metadata":
		outputJSON(&Response{Status: "success", Message: "插件信息", Result: pluginMeta})
	case "list_actions":
		outputJSON(&Response{Status: "success", Message: "支持的动作", Result: map[string]interface{}{"actions": pluginMeta["actions"]}})
	case "cdn":
		rep, err := Cdn(req.Params)
		if err != nil {
			outputError("CDN 部署失败", err)
			return
		}
		outputJSON(rep)
	case "dcdn":
		rep, err := Dcdn(req.Params)
		if err != nil {
			outputError("DCDN 部署失败", err)
			return
		}
		outputJSON(rep)
	case "oss":
		rep, err := Oss(req.Params)
		if err != nil {
			outputError("OSS 部署失败", err)
			return
		}
		outputJSON(rep)
	case "waf":
		rep, err := Waf(req.Params)
		if err != nil {
			outputError("WAF 部署失败", err)
			return
		}
		outputJSON(rep)
	case "esa":
		rep, err := Esa(req.Params)
		if err != nil {
			outputError("ESA 部署失败", err)
			return
		}
		outputJSON(rep)
	case "cas":
		rep, err := Cas(req.Params)
		if err != nil {
			outputError("CAS 上传失败", err)
			return
		}
		outputJSON(rep)
	default:
		outputJSON(&Response{Status: "error", Message: "未知 action: " + req.Action})
	}
}
