package modules

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestServeWaitsForShutdown(t *testing.T) {
	for _, mode := range []string{"标准输入关闭", "上下文取消", "排空超时"} {
		t.Run(mode, func(t *testing.T) {
			t.Setenv("ALLINSSL_MODULE_TOKEN", "test-token")
			stdin, input, err := os.Pipe()
			if err != nil {
				t.Fatal(err)
			}
			output, stdout, err := os.Pipe()
			if err != nil {
				stdin.Close()
				input.Close()
				t.Fatal(err)
			}
			oldIn, oldOut := os.Stdin, os.Stdout
			os.Stdin, os.Stdout = stdin, stdout
			ctx, cancel := context.WithCancel(context.Background())
			entered, release, exited := make(chan struct{}), make(chan struct{}), make(chan struct{})
			finish := sync.OnceFunc(func() { close(release) })
			done := make(chan error, 1)
			returned := make(chan struct{})
			t.Cleanup(func() {
				finish()
				cancel()
				input.Close()
				<-returned
				os.Stdin, os.Stdout = oldIn, oldOut
				stdin.Close()
				stdout.Close()
				output.Close()
			})
			go func() {
				done <- Serve(ctx, func(ctx context.Context, _ Invoke) Reply {
					close(entered)
					defer close(exited)
					select {
					case <-release:
						return Reply{Result: "已排空"}
					case <-ctx.Done():
						return Reply{Error: ctx.Err().Error()}
					}
				}, nil)
				close(returned)
			}()
			var ready struct {
				URL string `json:"url"`
			}
			if err := json.NewDecoder(output).Decode(&ready); err != nil {
				t.Fatal(err)
			}
			request, err := http.NewRequest("POST", ready.URL+"/invoke", strings.NewReader(`{}`))
			if err != nil {
				t.Fatal(err)
			}
			request.Header.Set("Authorization", "Bearer test-token")
			requested := make(chan error, 1)
			go func() {
				response, err := http.DefaultClient.Do(request)
				if err != nil {
					requested <- err
					return
				}
				defer response.Body.Close()
				body, err := io.ReadAll(response.Body)
				if err == nil && !strings.Contains(string(body), "已排空") {
					err = fmt.Errorf("业务响应错误: %s", body)
				}
				requested <- err
			}()
			select {
			case <-entered:
			case <-time.After(5 * time.Second):
				t.Fatal("请求未进入模块")
			}
			if mode == "标准输入关闭" {
				input.Close()
			} else {
				cancel()
			}
			select {
			case err := <-done:
				t.Fatalf("业务排空前 Serve 已返回: %v", err)
			case <-time.After(100 * time.Millisecond):
			}
			if mode != "排空超时" {
				finish()
			}
			select {
			case err := <-done:
				if mode == "排空超时" && !errors.Is(err, context.DeadlineExceeded) {
					t.Fatalf("排空超时应返回明确错误: %v", err)
				}
				if mode != "排空超时" && err != nil {
					t.Fatal(err)
				}
			case <-time.After(8 * time.Second):
				t.Fatal("关闭未在排空期限内结束")
			}
			<-exited
			if err := <-requested; mode != "排空超时" && err != nil {
				t.Fatal(err)
			}
		})
	}
}
