package modules

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"time"
)

var hostClient = &http.Client{Transport: &http.Transport{Proxy: nil}, CheckRedirect: rejectRedirect}

func rejectRedirect(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }

// Serve 启动协议 1 模块，宿主关闭标准输入时退出；标准输出只用于就绪消息。
func Serve(ctx context.Context, invoke func(context.Context, Invoke) Reply, api http.Handler) error {
	token := os.Getenv("ALLINSSL_MODULE_TOKEN")
	if token == "" {
		return fmt.Errorf("请由 ALLinSSL 启动模块")
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return err
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/invoke", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		var call Invoke
		if err := json.NewDecoder(r.Body).Decode(&call); err != nil {
			http.Error(w, "模块请求无效", http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(invoke(r.Context(), call))
	})
	if api != nil {
		mux.Handle("/api/", api)
	}
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer "+token {
			http.Error(w, "模块凭据无效", http.StatusUnauthorized)
			return
		}
		mux.ServeHTTP(w, r)
	})
	server := &http.Server{Handler: handler, ReadHeaderTimeout: 10 * time.Second}
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	if err := json.NewEncoder(os.Stdout).Encode(map[string]any{"protocol": 1, "url": "http://" + listener.Addr().String()}); err != nil {
		listener.Close()
		return err
	}
	stdin := os.Stdin
	go func() { _, _ = io.Copy(io.Discard, stdin); cancel() }()
	shutdownDone := make(chan error, 1)
	go func() {
		<-ctx.Done()
		shutdown, stop := context.WithTimeout(context.Background(), 5*time.Second)
		defer stop()
		err := server.Shutdown(shutdown)
		if err != nil {
			_ = server.Close()
		}
		shutdownDone <- err
	}()
	err = server.Serve(listener)
	cancel()
	shutdownErr := <-shutdownDone
	if err == http.ErrServerClosed {
		return shutdownErr
	}
	return err
}

// Call 只调用宿主登记且清单授权的原始业务操作，不接收 SQL 或任意 URL。
func Call(ctx context.Context, operation string, params map[string]any) (*HTTPResponse, error) {
	data, err := json.Marshal(map[string]any{"operation": operation, "params": params})
	if err != nil {
		return nil, err
	}
	request, err := http.NewRequestWithContext(ctx, "POST", os.Getenv("ALLINSSL_HOST_URL")+"/call", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Authorization", "Bearer "+os.Getenv("ALLINSSL_MODULE_TOKEN"))
	request.Header.Set("Content-Type", "application/json")
	response, err := hostClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("主服务业务调用失败: HTTP %d", response.StatusCode)
	}
	var result HTTPResponse
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}
