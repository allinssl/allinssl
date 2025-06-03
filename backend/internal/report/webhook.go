package report

import (
	"ALLinSSL/backend/public"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"net/http"
	"strings"
	"time"
)

type ReportConfig struct {
	Url       string `json:"url"`
	Data      string `json:"data,omitempty"`
	Method    string `json:"method,omitempty"`
	Headers   string `json:"headers,omitempty"`
	IgnoreSSL bool   `json:"ignore_ssl,omitempty"`
}

type WebHookReporter struct {
	config     *ReportConfig
	logger     *public.Logger
	httpClient *resty.Client
}

func NewWebHookReporter(config *ReportConfig, logger *public.Logger) *WebHookReporter {
	client := resty.New()
	client.SetTimeout(30 * time.Second)
	
	if config.IgnoreSSL {
		client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	}

	if config.Data == "" {
		config.Data = "{}" // 默认数据为空JSON对象
	}

	return &WebHookReporter{
		config:     config,
		logger:     logger,
		httpClient: client,
	}
}

func (w *WebHookReporter) Send(ctx context.Context) error {
	// 确定HTTP方法
	method := strings.ToUpper(w.config.Method)
	if method == "" {
		method = http.MethodPost // 默认使用POST方法
	}
	
	// 创建基础请求
	req := w.httpClient.R().
		SetContext(ctx)
	
	// 设置请求头
	if w.config.Headers != "" {
		reqHeader, err := w.ParseHeaders(w.config.Headers)
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
				err := json.Unmarshal([]byte(w.config.Data), &reqData)
				if err != nil {
					return fmt.Errorf("webhook数据解析失败err: %w", err)
				}
				req.SetBody(reqData)
			case "application/x-www-form-urlencoded":
				req.SetHeader("Content-Type", "application/x-www-form-urlencoded")
				reqData := make(map[string]string)
				err := json.Unmarshal([]byte(w.config.Data), &reqData)
				if err != nil {
					return fmt.Errorf("webhook数据解析失败err: %w", err)
				}
				req.SetFormData(reqData)
			case "multipart/form-data":
				req.SetHeader("Content-Type", "multipart/form-data")
				reqData := make(map[string]string)
				err := json.Unmarshal([]byte(w.config.Data), &reqData)
				if err != nil {
					return fmt.Errorf("webhook数据解析失败err: %w", err)
				}
				req.SetMultipartFormData(reqData)
			}
		}
	case http.MethodGet:
		{
			reqData := make(map[string]string)
			err := json.Unmarshal([]byte(w.config.Data), &reqData)
			if err != nil {
				return fmt.Errorf("webhook数据解析失败err: %w", err)
			}
			req.SetQueryParams(reqData)
		}
	default:
		return fmt.Errorf("暂不支持的HTTP方法: %s", method)
	}
	
	// 发送请求
	resp, err := req.Execute(method, w.config.Url)
	if err != nil {
		if w.logger != nil {
			w.logger.Error(fmt.Sprintf("Webhook请求失败%s %v", w.config.Url, err))
		}
		
		return fmt.Errorf("webhook请求失败: %w", err)
	}
	
	// 处理响应
	if resp.IsError() {
		if w.logger != nil {
			w.logger.Error(fmt.Sprintf("Webhook返回错误响应%s %d", w.config.Url, resp.StatusCode()))
		}
		return fmt.Errorf("webhook返回错误状态码: %d", resp.StatusCode())
	}
	
	if w.logger != nil {
		w.logger.Debug(fmt.Sprintf("Webhook请求成功 %s", w.config.Url))
	}
	return nil
}

func (w *WebHookReporter) ParseHeaders(headerStr string) (http.Header, error) {
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

func NotifyWebHook(params map[string]any) error {
	if params == nil {
		return fmt.Errorf("缺少参数")
	}
	providerID := params["provider_id"].(string)
	
	var logger *public.Logger
	
	if params["logger"] != nil {
		logger = params["logger"].(*public.Logger)
	}
	
	providerData, err := GetReport(providerID)
	if err != nil {
		return err
	}
	configStr := providerData["config"].(string)
	var config ReportConfig
	err = json.Unmarshal([]byte(configStr), &config)
	if err != nil {
		return fmt.Errorf("解析配置失败: %v", err)
	}
	
	if params["subject"] != nil && params["body"] != nil {
		subjStr, ok1 := params["subject"].(string)
		bodyStr, ok2 := params["body"].(string)
		if ok1 && ok2 {
			subjStr = strings.ReplaceAll(subjStr, `"`, `\"`)
			bodyStr = strings.ReplaceAll(bodyStr, `"`, `\"`)
			if strings.Contains(config.Data, "{subject}") {
				config.Data = strings.ReplaceAll(config.Data, "{subject}", subjStr+"\n")
			}
			if strings.Contains(config.Data, "{body}") {
				config.Data = strings.ReplaceAll(config.Data, "{body}", bodyStr)
			}
			config.Data = strings.ReplaceAll(config.Data, "\n", `\n`)
		}
	}

	reporter := NewWebHookReporter(&config, logger)
	httpctx := context.Background()
	err = reporter.Send(httpctx)
	if err != nil {
		return fmt.Errorf("webhook发送失败: %w", err)
	}
	return nil
}
