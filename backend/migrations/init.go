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
	exePath, err = filepath.EvalSymlinks(exePath) // 解决 macOS/Linux 下软链接问题
	if err != nil {
		fmt.Fprintf(os.Stderr, "解析软链接失败: %v\n", err)
		os.Exit(1)
	}
	exeDir := filepath.Dir(exePath)
	err = os.Chdir(exeDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "切换目录失败: %v\n", err)
		os.Exit(1)
	}
	
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

	create table workflow_deploy
	(
		id          TEXT,
		workflow_id TEXT,
		cert_hash   TEXT,
		status      TEXT,
		constraint workflow_deploy_pk
			primary key (id, workflow_id)
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
	
	InsertIfNotExists(db, "access_type", map[string]any{"name": "cloudflare", "type": "host"}, []string{"name", "type"}, []any{"cloudflare", "host"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "cloudflare", "type": "dns"}, []string{"name", "type"}, []any{"cloudflare", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "huaweicloud", "type": "host"}, []string{"name", "type"}, []any{"huaweicloud", "host"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "huaweicloud", "type": "dns"}, []string{"name", "type"}, []any{"huaweicloud", "dns"})
	
	InsertIfNotExists(db, "access_type", map[string]any{"name": "baidu", "type": "host"}, []string{"name", "type"}, []any{"baidu", "host"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "baidu", "type": "dns"}, []string{"name", "type"}, []any{"baidu", "dns"})
	
	InsertIfNotExists(db, "access_type", map[string]any{"name": "btwaf", "type": "host"}, []string{"name", "type"}, []any{"btwaf", "host"})
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

func InsertIfNotExists(
	db *sql.DB,
	table string,
	whereFields map[string]any, // 用于 WHERE 判断的字段和值
	insertColumns []string,
	insertValues []any,
) error {
	// 1. 构建 WHERE 子句
	whereClause := ""
	whereArgs := make([]any, 0, len(whereFields))
	i := 0
	for col, val := range whereFields {
		if i > 0 {
			whereClause += " AND "
		}
		whereClause += fmt.Sprintf("%s = ?", col)
		whereArgs = append(whereArgs, val)
		i++
	}
	
	// 2. 判断是否存在
	query := fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM %s WHERE %s)", table, whereClause)
	var exists bool
	err := db.QueryRow(query, whereArgs...).Scan(&exists)
	if err != nil {
		return fmt.Errorf("check exists failed: %w", err)
	}
	if exists {
		return nil // 已存在
	}
	
	// 3. 构建 INSERT 语句
	columnList := ""
	placeholderList := ""
	for i, col := range insertColumns {
		if i > 0 {
			columnList += ", "
			placeholderList += ", "
		}
		columnList += col
		placeholderList += "?"
	}
	insertSQL := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", table, columnList, placeholderList)
	
	_, err = db.Exec(insertSQL, insertValues...)
	if err != nil {
		return fmt.Errorf("insert failed: %w", err)
	}
	
	return nil
}
