package workflow

import (
	"ALLinSSL/backend/public"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"database/sql"
	"encoding/pem"
	"fmt"
	"math/big"
	"os"
	"strings"
	"testing"
	"time"
)

func TestUploadLocalCertificate(t *testing.T) {
	t.Chdir(t.TempDir())
	if err := os.Mkdir("data", 0755); err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", "data/data.db")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	_, err = db.Exec(`CREATE TABLE cert (id INTEGER PRIMARY KEY, sha256 TEXT, cert TEXT, key TEXT, domains TEXT, end_time TEXT, source TEXT, issuer TEXT, issuer_cert TEXT DEFAULT '', history_id TEXT, workflow_id TEXT, create_time TEXT, update_time TEXT, start_time TEXT, end_day TEXT)`)
	if err != nil {
		t.Fatal(err)
	}
	logger, err := public.NewLogger("test.log")
	if err != nil {
		t.Fatal(err)
	}
	defer logger.Close()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	keyDER, err := x509.MarshalECPrivateKey(key)
	if err != nil {
		t.Fatal(err)
	}
	keyPEM := string(pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDER}))
	now := time.Now().UTC().Truncate(time.Second)
	certs := make(map[string]string)
	for i, item := range []struct {
		id, domains string
		days        float64
	}{
		{"original", "example.invalid,www.example.invalid", 20},
		{"boundary", "example.invalid,www.example.invalid", 30},
		{"fresh", "example.invalid,www.example.invalid", 30.5},
		{"latest", "example.invalid,www.example.invalid", 90},
		{"partial", "example.invalid", 120},
		{"unrelated", "other.invalid", 200},
		{"expired", "expired.invalid", -1},
		{"short", "short.invalid", 30},
	} {
		expiry := now.Add(time.Duration(item.days * float64(24*time.Hour)))
		template := &x509.Certificate{SerialNumber: big.NewInt(int64(i + 1)), Subject: pkix.Name{CommonName: strings.Split(item.domains, ",")[0]}, DNSNames: strings.Split(item.domains, ","), NotBefore: now.Add(-time.Hour), NotAfter: expiry}
		der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
		if err != nil {
			t.Fatal(err)
		}
		certs[item.id] = string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}))
		_, err = db.Exec(`INSERT INTO cert (sha256,cert,key,domains,end_time) VALUES (?,?,?,?,?)`, item.id, certs[item.id], keyPEM, item.domains, expiry.Format("2006-01-02 15:04:05"))
		if err != nil {
			t.Fatal(err)
		}
	}
	for _, tc := range []struct {
		name, id, domains, want string
		enabled                 any
		days                    any
	}{
		{"旧引用缺省保持原证书", "original", "", "original", nil, nil},
		{"关闭时不校验隐藏字段", "original", "", "original", false, nil},
		{"超过阈值继续原证书", "fresh", "example.invalid,www.example.invalid", "fresh", true, float64(30)},
		{"达到边界选择到期最晚证书", "boundary", "example.invalid,www.example.invalid", "latest", true, float64(30)},
		{"低于阈值替换证书", "original", "example.invalid,www.example.invalid", "latest", true, float64(30)},
		{"匹配依据来自保存域名", "original", "other.invalid", "unrelated", true, float64(30)},
		{"候选不超过阈值报错", "original", "short.invalid", "", true, float64(30)},
		{"候选已过期报错", "original", "expired.invalid", "", true, float64(30)},
		{"域名不匹配报错", "original", "missing.invalid", "", true, float64(30)},
		{"全部域名必须匹配", "original", "example.invalid,missing.invalid", "", true, float64(30)},
		{"域名必填", "original", "", "", true, float64(30)},
		{"阈值必填", "original", "example.invalid", "", true, nil},
		{"引用已删除报错", "deleted", "example.invalid", "", true, float64(30)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			params := map[string]any{"logger": logger, "cert_id": tc.id, "domains": tc.domains, "use_local_cert": tc.enabled, "end_day": tc.days}
			result, err := Executors("upload", params)
			if tc.want == "" {
				if err == nil {
					t.Fatalf("应报错，实际返回：%v", result)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			output := result.(map[string]any)
			if output["cert"] != certs[tc.want] || output["key"] != keyPEM || output["skip"] != nil {
				t.Fatalf("证书输出不正确：%s", tc.want)
			}
			if params["cert_id"] != tc.id || params["domains"] != tc.domains {
				t.Fatal("执行不应修改节点配置")
			}
		})
	}
	log, err := os.ReadFile("test.log")
	if err != nil || !strings.Contains(string(log), "没有符合条件的本地证书") {
		t.Fatalf("执行日志应显示无符合条件证书的具体原因：%v", err)
	}
	result, err := Executors("upload", map[string]any{"logger": logger, "cert": certs["original"], "key": keyPEM})
	if err != nil || result.(map[string]any)["cert"] != certs["original"] {
		t.Fatalf("旧正文节点执行失败：%v", err)
	}
	var count int
	if err := db.QueryRow("SELECT count(*) FROM cert WHERE source='upload'").Scan(&count); err != nil || count != 1 {
		t.Fatal(fmt.Sprintf("旧正文应入库一次，实际：%d，%v", count, err))
	}
}
