package monitor

import (
	"database/sql"
	"os"
	"testing"
)

func TestBatchDeleteMonitor(t *testing.T) {
	t.Chdir(t.TempDir())
	if err := os.Mkdir("data", 0755); err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", "data/monitor.db")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	_, err = db.Exec(`CREATE TABLE monitor (id INTEGER PRIMARY KEY);
		CREATE TABLE err_record (id INTEGER PRIMARY KEY, monitor_id INTEGER);
		INSERT INTO monitor VALUES (1),(2),(3);
		INSERT INTO err_record VALUES (1,1),(2,2),(3,3);
		CREATE TRIGGER refuse_delete BEFORE DELETE ON err_record BEGIN SELECT RAISE(ABORT, '模拟错误记录删除失败'); END;`)
	if err != nil {
		t.Fatal(err)
	}
	if err := DelMonitor("1,2"); err == nil {
		t.Fatal("错误记录删除失败时应返回错误")
	}
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM monitor").Scan(&count); err != nil || count != 3 {
		t.Fatalf("删除失败应回滚监控记录：数量=%d，错误=%v", count, err)
	}
	if _, err := db.Exec("DROP TRIGGER refuse_delete"); err != nil {
		t.Fatal(err)
	}
	if err := DelMonitor("1,2,2"); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM monitor WHERE id IN (1,2)").Scan(&count); err != nil || count != 0 {
		t.Fatalf("选中监控应删除：数量=%d，错误=%v", count, err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM err_record WHERE monitor_id IN (1,2)").Scan(&count); err != nil || count != 0 {
		t.Fatalf("选中监控的错误记录应删除：数量=%d，错误=%v", count, err)
	}
	if err := DelMonitor("3) OR 1=1 --"); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM monitor WHERE id=3").Scan(&count); err != nil || count != 1 {
		t.Fatalf("未选中监控应保留：数量=%d，错误=%v", count, err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM err_record WHERE monitor_id=3").Scan(&count); err != nil || count != 1 {
		t.Fatalf("未选中监控的错误记录应保留：数量=%d，错误=%v", count, err)
	}
	if DelMonitor("") == nil {
		t.Fatal("空ID应报错")
	}
	if err := DelMonitor("3"); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM err_record").Scan(&count); err != nil || count != 0 {
		t.Fatalf("单项删除应继续清理错误记录：数量=%d，错误=%v", count, err)
	}
}
