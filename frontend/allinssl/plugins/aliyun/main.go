package main

import (
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"os"
)

type ActionInfo struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Params      map[string]any `json:"params,omitempty"` // 可选参数
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

var pluginMeta = map[string]interface{}{
	"name":        "aliyun",
	"description": "部署到阿里云",
	"version":     "1.0.0",
	"author":      "主包",
	"config": map[string]interface{}{
		"access_key": "阿里云 AccessKey",
		"secret_key": "阿里云 SecretKey",
	},
	"actions": []ActionInfo{
		{
			Name:        "deployToESA",
			Description: "部署到阿里云esa",
			Params: map[string]any{
				"site_id":                "站点 ID",
				"del_repeat_domain_cert": "是否删除重复的域名证书，默认 false",
			},
		},
		{
			Name:        "uploadToCAS",
			Description: "上传到阿里云cas",
			Params: map[string]any{
				"name": "证书名称",
			},
		},
	},
}

// **解析 PEM 格式的证书**
func ParseCertificate(certPEM []byte) (*x509.Certificate, error) {
	block, _ := pem.Decode(certPEM)
	if block == nil {
		return nil, fmt.Errorf("无法解析证书 PEM")
	}
	return x509.ParseCertificate(block.Bytes)
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
		outputJSON(&Response{
			Status:  "success",
			Message: "插件信息",
			Result:  pluginMeta,
		})
	case "list_actions":
		outputJSON(&Response{
			Status:  "success",
			Message: "支持的动作",
			Result:  map[string]interface{}{"actions": pluginMeta["actions"]},
		})
	case "deployToESA":
		rep, err := deployToESA(req.Params)
		if err != nil {
			outputError("ESA 部署失败", err)
			return
		}
		outputJSON(rep)
	case "uploadToCAS":
		rep, err := uploadToCAS(req.Params)
		if err != nil {
			outputError("CAS 上传失败", err)
			return
		}
		outputJSON(rep)
	default:
		outputJSON(&Response{
			Status:  "error",
			Message: "未知 action: " + req.Action,
		})
	}
}
