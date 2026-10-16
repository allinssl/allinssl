package module

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHTTPReplacementStreamsBeforeCompletion(t *testing.T) {
	release := make(chan struct{})
	var original atomic.Bool
	plugin := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer stream-test" {
			w.WriteHeader(401)
			return
		}
		if r.URL.Path == "/invoke" {
			_ = json.NewEncoder(w).Encode(Reply{Stream: true})
			return
		}
		if r.URL.Path != "/api/_hooks/http" || r.Header.Get("X-Allinssl-Hook-Handler") != "download" {
			w.WriteHeader(400)
			return
		}
		w.Header().Set("Content-Type", "application/octet-stream")
		_, _ = io.WriteString(w, "first")
		w.(http.Flusher).Flush()
		select {
		case <-release:
			_, _ = io.WriteString(w, "last")
		case <-r.Context().Done():
		}
	}))
	defer plugin.Close()
	manager, err := New(t.TempDir(), t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	manager.plugins["stream"] = &installed{Info: Info{Manifest: Manifest{ID: "stream", Hooks: []Hook{{Kind: "http", Target: "GET /v1/cert/download", Stage: "replace", Handler: "download"}}}, Enabled: true, Status: "running"}, published: true, proc: &process{ctx: ctx, token: "stream-test", url: plugin.URL}}
	defer func() { manager.plugins["stream"].proc = nil; manager.Close() }()
	router := gin.New()
	router.Use(manager.Middleware)
	router.GET("/v1/cert/download", func(c *gin.Context) { original.Store(true); c.String(200, "原实现") })
	host := httptest.NewServer(router)
	defer host.Close()
	request, _ := http.NewRequestWithContext(ctx, "GET", host.URL+"/v1/cert/download", nil)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	first := make([]byte, 5)
	if _, err := io.ReadFull(response.Body, first); err != nil || string(first) != "first" {
		t.Fatalf("应在流结束前收到首段: %q %v", first, err)
	}
	close(release)
	last, err := io.ReadAll(response.Body)
	if err != nil || string(last) != "last" || original.Load() {
		t.Fatalf("流式替换结果错误或执行了原业务: %q %v", last, err)
	}
}
