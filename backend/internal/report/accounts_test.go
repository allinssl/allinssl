package report

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"os"
	"reflect"
	"strings"
	"sync"
	"testing"

	_ "modernc.org/sqlite"
)

func TestReportAccounts(t *testing.T) {
	t.Chdir(t.TempDir())
	if err := os.Mkdir("data", 0755); err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", "data/data.db")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if _, err = db.Exec(`CREATE TABLE report (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, config TEXT, name TEXT, create_time TEXT, update_time TEXT)`); err != nil {
		t.Fatal(err)
	}
	for _, channel := range []string{"mail", "feishu", "dingtalk", "workwx", "webhook"} {
		for _, name := range []string{"旧账号", "新账号"} {
			if err := AddReport(channel, `{"enabled":"1","secret":"原凭据"}`, channel+name); err != nil {
				t.Fatal(err)
			}
		}
	}
	accounts, count, err := GetList("", 1, 100)
	if err != nil || count != 10 || len(accounts) != 10 {
		t.Fatalf("多个账号保存失败：数量 %d，错误 %v", count, err)
	}
	if err := UpdReport("2", `{"enabled":"0","secret":"新凭据"}`, "修改新账号"); err != nil {
		t.Fatal(err)
	}
	if err := DelReport("2"); err != nil {
		t.Fatal(err)
	}
	legacy, err := GetReport("1")
	if err != nil || legacy["config"] != `{"enabled":"1","secret":"原凭据"}` || legacy["name"] != "mail旧账号" {
		t.Fatalf("操作新账号影响了旧配置：%v，错误 %v", legacy, err)
	}
}

func TestMonitorReportAccounts(t *testing.T) {
	t.Chdir(t.TempDir())
	if err := os.Mkdir("data", 0755); err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", "data/data.db")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if _, err = db.Exec(`CREATE TABLE report (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, config TEXT, name TEXT, create_time TEXT, update_time TEXT)`); err != nil {
		t.Fatal(err)
	}
	var received []string
	var receivedMu sync.Mutex
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		if r.URL.Path != "/旧账号" && !strings.Contains(string(body), "测试内容") {
			t.Errorf("通知正文未正确发送：%s", body)
		}
		receivedMu.Lock()
		received = append(received, r.URL.Path)
		receivedMu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/失败账号" {
			w.WriteHeader(http.StatusBadRequest)
		}
		fmt.Fprint(w, `{"code":0,"errcode":0}`)
	}))
	defer server.Close()
	for _, account := range []struct{ channel, name, enabled string }{
		{"webhook", "旧账号", ""}, {"webhook", "新账号", "1"}, {"webhook", "停用账号", "0"},
		{"webhook", "失败账号", "1"}, {"feishu", "飞书账号", "1"}, {"dingtalk", "钉钉账号", "1"}, {"workwx", "微信账号", "1"},
	} {
		config, _ := json.Marshal(map[string]any{
			"url": server.URL + "/" + account.name, "webhook": server.URL + "/" + account.name,
			"data": `{"content":"__body__"}`, "method": "post", "headers": "Content-Type: application/json",
			"enabled": account.enabled, "secret": "",
		})
		if err := AddReport(account.channel, string(config), account.name); err != nil {
			t.Fatal(err)
		}
	}
	for _, tc := range []struct {
		accounts string
		want     []string
		wantErr  bool
	}{
		{"webhook", []string{"/旧账号"}, false},
		{"1,2", []string{"/旧账号", "/新账号"}, false},
		{"webhook,1,2,2,3", []string{"/旧账号", "/新账号"}, false},
		{"4,2", []string{"/失败账号", "/新账号"}, true},
		{"999,2", []string{"/新账号"}, true},
		{"5,6,7", []string{"/飞书账号", "/钉钉账号", "/微信账号"}, false},
		{"feishu,dingtalk,workwx", []string{"/飞书账号", "/钉钉账号", "/微信账号"}, false},
	} {
		receivedMu.Lock()
		received = nil
		receivedMu.Unlock()
		err := NotifyMonitor(tc.accounts, "测试标题", "测试内容")
		receivedMu.Lock()
		got := append([]string(nil), received...)
		receivedMu.Unlock()
		if (err != nil) != tc.wantErr || !reflect.DeepEqual(got, tc.want) {
			t.Fatalf("账号 %s 的发送结果 %v，期望 %v，错误 %v", tc.accounts, got, tc.want, err)
		}
	}
	// 旧工作流保存的账号 ID 仍可独立发送。
	if err := Notify(map[string]any{"provider": "webhook", "provider_id": "2", "subject": "测试标题", "body": "测试内容"}); err != nil {
		t.Fatal(err)
	}
	if err := NotifyTest("1"); err != nil {
		t.Fatal(err)
	}
}

func TestMailAccountConfigs(t *testing.T) {
	t.Chdir(t.TempDir())
	if err := os.Mkdir("data", 0755); err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", "data/data.db")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if _, err = db.Exec(`CREATE TABLE report (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, config TEXT, name TEXT, create_time TEXT, update_time TEXT)`); err != nil {
		t.Fatal(err)
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	messages := make(chan string, 4)
	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				return
			}
			client := textproto.NewConn(conn)
			client.PrintfLine("220 localhost")
			for {
				line, err := client.ReadLine()
				if err != nil {
					break
				}
				switch strings.Fields(line)[0] {
				case "EHLO":
					client.PrintfLine("250-localhost\r\n250 AUTH PLAIN")
				case "DATA":
					client.PrintfLine("354 输入邮件")
					message, _ := client.ReadDotBytes()
					messages <- string(message)
					client.PrintfLine("250 已接收")
				case "QUIT":
					client.PrintfLine("221 结束")
					client.Close()
				case "AUTH":
					client.PrintfLine("235 已认证")
				default:
					client.PrintfLine("250 正常")
				}
			}
			client.Close()
		}
	}()
	_, port, _ := net.SplitHostPort(listener.Addr().String())
	for i, tlsValue := range []any{false, "false", nil} {
		config := map[string]any{"sender": fmt.Sprintf("account%d@example.com", i), "receiver": "receiver@example.com", "password": "测试密码", "smtpHost": "127.0.0.1", "smtpPort": port}
		if tlsValue != nil {
			config["smtpTLS"] = tlsValue
		}
		data, _ := json.Marshal(config)
		if err := AddReport("mail", string(data), fmt.Sprintf("邮箱%d", i)); err != nil {
			t.Fatal(err)
		}
	}
	if err := NotifyMonitor("1,2,3", "测试标题", "测试内容"); err != nil {
		t.Fatal(err)
	}
	for i := range 3 {
		message := <-messages
		if !strings.Contains(message, fmt.Sprintf("account%d@example.com", i)) || !strings.Contains(message, "receiver@example.com") {
			t.Fatalf("邮箱账号或收件人不正确：%s", message)
		}
	}
	if err := NotifyMonitor("mail", "测试标题", "测试内容"); err != nil {
		t.Fatal(err)
	}
	if message := <-messages; !strings.Contains(message, "account0@example.com") {
		t.Fatalf("旧邮箱监控没有使用原账号：%s", message)
	}
}
