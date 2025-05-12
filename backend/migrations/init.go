package migrations

import (
	"ALLinSSL/backend/public"
	"database/sql"
	"fmt"
	_ "modernc.org/sqlite"
	"os"
	"path/filepath"
)

func init() {
	// 指定运行目录为当前目录
	exePath, err := os.Executable()
	if err != nil {
		fmt.Fprintf(os.Stderr, "获取可执行文件路径失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("exePath:", exePath)
	
	exePath, err = filepath.EvalSymlinks(exePath) // 解决 macOS/Linux 下软链接问题
	if err != nil {
		fmt.Fprintf(os.Stderr, "解析软链接失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("exePath:", exePath)
	
	exeDir := filepath.Dir(exePath)
	fmt.Println("exeDir:", exeDir)
	
	err = os.Chdir(exeDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "切换目录失败: %v\n", err)
		os.Exit(1)
	}
	
	dir, err := os.Getwd()
	if err != nil {
		fmt.Println("获取工作目录失败:", err)
		return
	}
	fmt.Println("当前运行目录是:", dir)
	
	os.MkdirAll("data", os.ModePerm)
	
	dbPath := "data/data.db"
	_, _ = filepath.Abs(dbPath)
	// fmt.Println("数据库路径:", absPath)
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		// fmt.Println("创建数据库失败:", err)
		return
	}
	defer db.Close()
	// 创建表
	_, err = db.Exec(`
	create table IF NOT EXISTS _accounts
	(
	    id          integer not null
	        constraint _accounts_pk
	            primary key autoincrement,
	    private_key TEXT    not null,
	    reg         TEXT    not null,
	    email       TEXT    not null,
	    create_time TEXT,
	    update_time TEXT,
	    type        TEXT
	);
	
	create table IF NOT EXISTS access
	(
	    id          integer not null
	        constraint access_pk
	            primary key autoincrement,
	    config      TEXT    not null,
	    type        TEXT    not null,
	    create_time TEXT,
	    update_time TEXT,
	    name        TEXT    not null
	);
	
	create table IF NOT EXISTS access_type
	(
	    id   integer not null
	        constraint access_type_pk
	            primary key autoincrement,
	    name TEXT,
	    type TEXT
	);
	
	create table IF NOT EXISTS cert
	(
	    id          integer not null
	        constraint cert_pk
	            primary key autoincrement,
	    source      TEXT    not null,
	    sha256      TEXT,
	    history_id  TEXT,
	    key         TEXT    not null,
	    cert        TEXT    not null,
	    issuer_cert integer,
	    domains     TEXT    not null,
	    create_time TEXT,
	    update_time TEXT,
	    issuer      TEXT    not null,
	    start_time  TEXT,
	    end_time    TEXT,
	    end_day     TEXT,
	    workflow_id TEXT
	);
	
	create table IF NOT EXISTS report
	(
	    id          integer not null
	        constraint report_pk
	            primary key autoincrement,
	    type        TEXT    not null,
	    config      TEXT    not null,
	    create_time TEXT,
	    update_time TEXT,
	    name        TEXT
	);
	
	create table IF NOT EXISTS settings
	(
	    id          integer
	        constraint settings_pk
	            primary key,
	    key         TEXT,
	    value       TEXT,
	    create_time TEXT    not null,
	    update_time TEXT    not null,
	    active      integer not null,
	    type        TEXT
	);
	
	create table IF NOT EXISTS site_monitor
	(
	    id              integer not null
	        constraint site_monitor_pk
	            primary key autoincrement,
	    name            TEXT    not null,
	    site_domain     TEXT    not null,
	    cycle           integer not null,
	    report_type     TEXT    not null,
	    cert_domain     TEXT,
	    ca              TEXT,
	    active          integer,
	    end_time        TEXT,
	    end_day         TEXT,
	    last_time       TEXT,
	    except_end_time TEXT,
	    create_time     TEXT,
	    state           TEXT,
	    update_time     TEXT,
	    repeat_send_gap INTEGER
	);
	
	create table IF NOT EXISTS users
	(
	    id       integer         not null
	        constraint users_pk
	            primary key autoincrement,
	    username TEXT            not null
	        constraint users_pk2
	            unique,
	    password TEXT            not null,
	    salt     TEXT default '' not null
	);
	
	
	create table IF NOT EXISTS workflow
	(
	    id              integer not null
	        constraint workflow_pk
	            primary key autoincrement,
	    name            TEXT    not null,
	    content         TEXT    not null,
	    cron            TEXT,
	    create_time     TEXT,
	    update_time     TEXT,
	    active          integer,
	    exec_type       TEXT,
	    last_run_status TEXT,
	    exec_time       TEXT,
	    last_run_time   TEXT
	);
	
	create table IF NOT EXISTS workflow_history
	(
	    id          TEXT not null
	        constraint work_flow_pk
	            primary key,
	    status      TEXT,
	    exec_type   TEXT,
	    create_time TEXT,
	    end_time    TEXT,
	    workflow_id TEXT not null
	);
	`)
	insertDefaultData(db, "users", "INSERT INTO users (id, username, password, salt) VALUES (1, 'xxxx', 'xxxxxxx', '&*ghs^&%dag');")
	insertDefaultData(db, "access_type", `
	INSERT INTO access_type (name, type) VALUES ('aliyun', 'dns');
	INSERT INTO access_type (name, type) VALUES ('tencentcloud', 'dns');
	INSERT INTO access_type (name, type) VALUES ('aliyun', 'host');
	INSERT INTO access_type (name, type) VALUES ('tencentcloud', 'host');
	INSERT INTO access_type (name, type) VALUES ('ssh', 'host');
	INSERT INTO access_type (name, type) VALUES ('btpanel', 'host');
	INSERT INTO access_type (name, type) VALUES ('1panel', 'host');`)
	
	uuidStr := public.GenerateUUID()
	randomStr := public.RandomString(8)
	
	port, err := public.GetFreePort()
	if err != nil {
		port = 20773
	}
	
	Isql := fmt.Sprintf(
		`INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ('log_path', 'logs/ALLinSSL.log', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ( 'workflow_log_path', 'logs/workflows/', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ( 'timeout', '3600', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ( 'https', '0', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ( 'login_key', '%s', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ('session_key', '%s', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ('secure', '/%s', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ('port', '%d', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);`, uuidStr, uuidStr, randomStr, port)
	
	insertDefaultData(db, "settings", Isql)
}

func insertDefaultData(db *sql.DB, table, insertSQL string) {
	// 查询用户表中现有的记录数
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM " + table).Scan(&count)
	if err != nil {
		// fmt.Println("检查数据行数失败:", err)
		return
	}
	
	// 如果表为空，则插入默认数据
	if count == 0 {
		// fmt.Println("表为空，插入默认数据...")
		_, err = db.Exec(insertSQL)
		if err != nil {
			// fmt.Println("插入数据失败:", err)
			return
		}
		// fmt.Println("默认数据插入成功。")
		// } else {
		// 	fmt.Println("表已有数据，跳过插入。")
	}
}
