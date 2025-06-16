package migrations

import (
	"ALLinSSL/backend/public"
	"ALLinSSL/backend/public/sqlite_migrate"
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
	PRAGMA journal_mode=WAL;
	
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

	create table IF NOT EXISTS workflow_deploy
	(
		id          TEXT,
		workflow_id TEXT,
		cert_hash   TEXT,
		status      TEXT,
		constraint workflow_deploy_pk
			primary key (id, workflow_id)
	);

	`)
	insertDefaultData(db, "access_type", `
	INSERT INTO access_type (name, type) VALUES ('aliyun', 'dns');
	INSERT INTO access_type (name, type) VALUES ('tencentcloud', 'dns');
	INSERT INTO access_type (name, type) VALUES ('aliyun', 'host');
	INSERT INTO access_type (name, type) VALUES ('tencentcloud', 'host');
	INSERT INTO access_type (name, type) VALUES ('ssh', 'host');
	INSERT INTO access_type (name, type) VALUES ('btpanel', 'host');
	INSERT INTO access_type (name, type) VALUES ('1panel', 'host');`)

	InsertIfNotExists(db, "access_type", map[string]any{"name": "cloudflare", "type": "host"}, []string{"name", "type"}, []any{"cloudflare", "host"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "cloudflare", "type": "dns"}, []string{"name", "type"}, []any{"cloudflare", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "huaweicloud", "type": "host"}, []string{"name", "type"}, []any{"huaweicloud", "host"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "huaweicloud", "type": "dns"}, []string{"name", "type"}, []any{"huaweicloud", "dns"})

	InsertIfNotExists(db, "access_type", map[string]any{"name": "baidu", "type": "host"}, []string{"name", "type"}, []any{"baidu", "host"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "baidu", "type": "dns"}, []string{"name", "type"}, []any{"baidu", "dns"})

	InsertIfNotExists(db, "access_type", map[string]any{"name": "btwaf", "type": "host"}, []string{"name", "type"}, []any{"btwaf", "host"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "doge", "type": "host"}, []string{"name", "type"}, []any{"doge", "host"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "plugin", "type": "host"}, []string{"name", "type"}, []any{"plugin", "host"})

	// 雷池
	InsertIfNotExists(db, "access_type", map[string]any{"name": "safeline", "type": "host"}, []string{"name", "type"}, []any{"safeline", "host"})
	// 七牛
	InsertIfNotExists(db, "access_type", map[string]any{"name": "qiniu", "type": "host"}, []string{"name", "type"}, []any{"qiniu", "host"})
	// 西部数码
	InsertIfNotExists(db, "access_type", map[string]any{"name": "westcn", "type": "dns"}, []string{"name", "type"}, []any{"westcn", "dns"})
	// 火山引擎
	InsertIfNotExists(db, "access_type", map[string]any{"name": "volcengine", "type": "dns"}, []string{"name", "type"}, []any{"volcengine", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "volcengine", "type": "host"}, []string{"name", "type"}, []any{"volcengine", "host"})
	// godaddy
	InsertIfNotExists(db, "access_type", map[string]any{"name": "godaddy", "type": "dns"}, []string{"name", "type"}, []any{"godaddy", "dns"})

	InsertIfNotExists(db, "access_type", map[string]any{"name": "namecheap", "type": "dns"}, []string{"name", "type"}, []any{"namecheap", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "ns1", "type": "dns"}, []string{"name", "type"}, []any{"ns1", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "cloudns", "type": "dns"}, []string{"name", "type"}, []any{"cloudns", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "aws", "type": "dns"}, []string{"name", "type"}, []any{"aws", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "azure", "type": "dns"}, []string{"name", "type"}, []any{"azure", "dns"})

	InsertIfNotExists(db, "access_type", map[string]any{"name": "jdcloud", "type": "dns"}, []string{"name", "type"}, []any{"jdcloud", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "gcore", "type": "dns"}, []string{"name", "type"}, []any{"gcore", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "bunny", "type": "dns"}, []string{"name", "type"}, []any{"bunny", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "namedotcom", "type": "dns"}, []string{"name", "type"}, []any{"namedotcom", "dns"})
	InsertIfNotExists(db, "access_type", map[string]any{"name": "namesilo", "type": "dns"}, []string{"name", "type"}, []any{"namesilo", "dns"})

	err = sqlite_migrate.EnsureDatabaseWithTables(
		"data/site_monitor.db",
		"data/data.db",
		[]string{"site_monitor"}, // 你要迁移的表
	)
	if err != nil {
		fmt.Println("错误:", err)
	}

	db1, err := sql.Open("sqlite", "data/site_monitor.db")
	if err != nil {
		// fmt.Println("创建数据库失败:", err)
		return
	}
	defer db1.Close()
	// 创建表
	_, err = db1.Exec(`
	PRAGMA journal_mode=WAL;
 
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
       `)

	err = sqlite_migrate.EnsureDatabaseWithTables(
		"data/settings.db",
		"data/data.db",
		[]string{"settings", "users"}, // 你要迁移的表
	)
	if err != nil {
		fmt.Println("错误:", err)
	}
	dbSetting, err := sql.Open("sqlite", "data/settings.db")
	if err != nil {
		//fmt.Println("创建 settings 数据库失败:", err)
		return
	}
	defer dbSetting.Close()
	// 创建表
	_, err = dbSetting.Exec(`
	PRAGMA journal_mode=WAL;

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
       `)
	insertDefaultData(dbSetting, "users", "INSERT INTO users (id, username, password, salt) VALUES (1, 'admin', 'xxxxxxx', '&*ghs^&%dag');")
	uuidStr := public.GenerateUUID()
	randomStr := public.RandomString(8)

	port, err := public.GetFreePort()
	if err != nil {
		port = 20773
	}

	Isql := fmt.Sprintf(
		`INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ('log_path', 'logs/ALLinSSL.log', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ( 'workflow_log_path', 'logs/workflows/', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ( 'timeout', '86400', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ( 'https', '0', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ('session_key', '%s', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ('secure', '/%s', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);
INSERT INTO settings (key, value, create_time, update_time, active, type) VALUES ('port', '%d', '2025-04-15 15:58', '2025-04-15 15:58', 1, null);`, uuidStr, randomStr, port)

	insertDefaultData(dbSetting, "settings", Isql)
	InsertIfNotExists(dbSetting, "settings", map[string]any{"key": "plugin_dir"}, []string{"key", "value", "create_time", "update_time", "active"}, []any{"plugin_dir", "plugins", "2025-04-15 15:58", "2025-04-15 15:58", 1})

	err = sqlite_migrate.EnsureDatabaseWithTables(
		"data/accounts.db",
		"data/data.db",
		[]string{"_accounts", "_eab"}, // 你要迁移的表
	)
	if err != nil {
		fmt.Println("错误:", err)
	}
	dbAcc, err := sql.Open("sqlite", "data/accounts.db")
	if err != nil {
		//fmt.Println("创建 settings 数据库失败:", err)
		return
	}
	defer dbAcc.Close()
	// 创建表
	_, err = dbAcc.Exec(`
	PRAGMA journal_mode=WAL;

	create table if not exists accounts
	(
		id          integer not null
			constraint _accounts_pk
				primary key autoincrement,
		private_key TEXT    ,
		reg         TEXT    ,
		email       TEXT    not null,
		type        TEXT    not null,
		Kid         TEXT    ,
		HmacEncoded         TEXT    ,
		CADirURL         TEXT    ,
		create_time TEXT,
		update_time TEXT
	);
       `)
	insertSql := `
	insert into accounts (id, private_key, reg, email, create_time, update_time, type, Kid, HmacEncoded)
	select a.id, a.private_key, a.reg, a.email, a.create_time, a.update_time, case when a.type like 'sslcom%' then 'sslcom' else a.type end, b.Kid,b.HmacEncoded
	from _accounts a
	left join _eab b
		on a.email = b.mail and a.type like b.ca||'%';
`
	insertDefaultData(dbAcc, "accounts", insertSql)
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
