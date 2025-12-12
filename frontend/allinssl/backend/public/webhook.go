package public

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type WebhookConfig struct {
	Url       string `json:"url"`
	Data      string `json:"data,omitempty"`
	Method    string `json:"method,omitempty"`
	Headers   string `json:"headers,omitempty"`
	IgnoreSSL bool   `json:"ignore_ssl,omitempty"`
}

func (w *WebhookConfig) Send() error {
	// 确定HTTP方法
	method := strings.ToUpper(w.Method)
	if method == "" {
		method = http.MethodPost // 默认使用POST方法
	}

	client := resty.New()
	client.SetTimeout(30 * time.Second)

	if w.IgnoreSSL {
		client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	}

	req := client.R()

	// 设置请求头
	if w.Headers != "" {
		reqHeader, err := w.ParseHeaders(w.Headers)
		if err != nil {
			return fmt.Errorf("解析请求头错误: %w", err)
		}
		req.Header = reqHeader
	}

	switch method {
	case http.MethodPost:
		{
			contentType := req.Header.Get("application/json")
			if contentType == "" {
				contentType = "application/json"
			}
			switch contentType {
			case "application/json":
				req.SetHeader("Content-Type", "application/json")
				var reqData interface{}
				err := json.Unmarshal([]byte(w.Data), &reqData)
				if err != nil {
					return fmt.Errorf("webhook数据解析失败err: %w", err)
				}

				req.SetBody(reqData)
			case "application/x-www-form-urlencoded":
				req.SetHeader("Content-Type", "application/x-www-form-urlencoded")
				reqData := make(map[string]string)
				err := json.Unmarshal([]byte(w.Data), &reqData)
				if err != nil {
					return fmt.Errorf("webhook数据解析失败err: %w", err)
				}
				req.SetFormData(reqData)
			case "multipart/form-data":
				req.SetHeader("Content-Type", "multipart/form-data")
				reqData := make(map[string]string)
				err := json.Unmarshal([]byte(w.Data), &reqData)
				if err != nil {
					return fmt.Errorf("webhook数据解析失败err: %w", err)
				}
				req.SetMultipartFormData(reqData)
			}
		}
	case http.MethodGet:
		{
			reqData := make(map[string]string)
			err := json.Unmarshal([]byte(w.Data), &reqData)
			if err != nil {
				return fmt.Errorf("webhook数据解析失败err: %w", err)
			}
			req.SetQueryParams(reqData)
		}
	default:
		return fmt.Errorf("暂不支持的HTTP方法: %s", method)
	}

	// 发送请求
	resp, err := req.Execute(method, w.Url)
	if err != nil {
		return fmt.Errorf("webhook请求失败: %w", err)
	}

	// 处理响应
	if resp.IsError() {
		return fmt.Errorf("webhook返回错误状态码: %d, msg: %s", resp.StatusCode(), resp.String())
	}

	return nil
}

func (w *WebhookConfig) ParseHeaders(headerStr string) (http.Header, error) {
	headers := make(http.Header)
	lines := strings.Split(headerStr, "\n")

	for i, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("解析请求头错误 第%d行: %s", i+1, line)
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if key == "" || value == "" {
			return nil, fmt.Errorf("请求头Key第%d行为空", i+1)
		}
		canonicalKey := http.CanonicalHeaderKey(key)
		headers.Add(canonicalKey, value)
	}

	return headers, nil
}

func ReplaceJSONPlaceholders(jsonStr string, vars map[string]any) (string, error) {
	re := regexp.MustCompile(`__([a-zA-Z0-9_]+)__`)
	result := re.ReplaceAllStringFunc(jsonStr, func(match string) string {
		key := re.FindStringSubmatch(match)[1]
		if val, ok := vars[key]; ok {
			escaped := strconv.Quote(fmt.Sprintf("%v", val)) // 将 any 类型转换为字符串
			return escaped[1 : len(escaped)-1]
		}
		return match // 未匹配到变量则保留原样
	})

	return result, nil
}
