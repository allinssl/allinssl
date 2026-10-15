package private_ca

import (
	"database/sql"
	"os"
	"testing"
)

func TestBatchDeleteCertificates(t *testing.T) {
	t.Chdir(t.TempDir())
	if err := os.Mkdir("data", 0755); err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", "data/private_ca.db")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	_, err = db.Exec(`CREATE TABLE ca (id INTEGER PRIMARY KEY, root_id INTEGER);
		CREATE TABLE leaf (id INTEGER PRIMARY KEY);
		INSERT INTO ca VALUES (1,0),(2,1),(3,0),(4,0);
		INSERT INTO leaf VALUES (1),(2),(3),(4);`)
	if err != nil {
		t.Fatal(err)
	}
	if err := DeleteCA("1,3"); err == nil {
		t.Fatal("存在未选中的下级CA时应阻止整批删除")
	}
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM ca").Scan(&count); err != nil || count != 4 {
		t.Fatalf("删除受阻时不应删除其他选中项：数量=%d，错误=%v", count, err)
	}
	if err := DeleteCA("1,2,2"); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM ca WHERE id IN (3,4)").Scan(&count); err != nil || count != 2 {
		t.Fatalf("未选中的CA应保留：数量=%d，错误=%v", count, err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM ca WHERE id IN (1,2)").Scan(&count); err != nil || count != 0 {
		t.Fatalf("父子CA应同时删除：数量=%d，错误=%v", count, err)
	}
	if err := DeleteCA("3) OR 1=1 --"); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM ca").Scan(&count); err != nil || count != 2 {
		t.Fatalf("ID必须通过参数绑定，不能扩大删除范围：数量=%d，错误=%v", count, err)
	}
	if err := DeleteCA("3"); err != nil {
		t.Fatal(err)
	}
	if err := DeleteLeafCert("1,2,2"); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM leaf WHERE id IN (3,4)").Scan(&count); err != nil || count != 2 {
		t.Fatalf("未选中的私有证书应保留：数量=%d，错误=%v", count, err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM leaf WHERE id IN (1,2)").Scan(&count); err != nil || count != 0 {
		t.Fatalf("选中的私有证书应删除：数量=%d，错误=%v", count, err)
	}
	if err := DeleteLeafCert("3"); err != nil {
		t.Fatal(err)
	}
	if DeleteCA("") == nil || DeleteLeafCert("") == nil {
		t.Fatal("空ID应报错")
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM ca WHERE id=4").Scan(&count); err != nil || count != 1 {
		t.Fatalf("未选中的CA应始终保留：数量=%d，错误=%v", count, err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM leaf WHERE id=4").Scan(&count); err != nil || count != 1 {
		t.Fatalf("未选中的私有证书应始终保留：数量=%d，错误=%v", count, err)
	}
}
