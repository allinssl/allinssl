package sqlite_migrate

import (
	"fmt"
	"os"
	"testing"
)

func Test(t *testing.T) {
	err := os.Chdir("D:/code/ALLinSSL")
	if err != nil {
		fmt.Fprintf(os.Stderr, "切换目录失败: %v\n", err)
		os.Exit(1)
	}
	err = EnsureDatabaseWithTables(
		"data/111.db",
		"data/data.db",
		[]string{"1111"}, // 你要迁移的表
	)
	if err != nil {
		fmt.Println("错误:", err)
	}
}

func Test1(t *testing.T) {
	err := os.Chdir("D:/code/ALLinSSL")
	if err != nil {
		fmt.Fprintf(os.Stderr, "切换目录失败: %v\n", err)
		os.Exit(1)
	}
	columnMapping := map[string]string{
		"name":            "name",
		"site_domain":     "target",
		"report_type":     "report_types",
		"active":          "active",
		"last_time":       "last_time",
		"except_end_time": "except_end_time",
		"update_time":     "update_time",
		"create_time":     "create_time",
		"cycle":           "cycle",
		"repeat_send_gap": "repeat_send_gap",
	}

	createTableSQL := `
create table monitor
(
    id              integer                 not null
        constraint monitor_pk
            primary key autoincrement,
    name            TEXT                    not null,
    target          TEXT                    not null,
    monitor_type    TEXT    default 'https' not null,
    report_types    TEXT                    not null,
    active          integer default 1,
    info            TEXT,
    last_time       TEXT,
    except_end_time TEXT,
    update_time     TEXT,
    create_time     TEXT,
    cycle           integer,
    repeat_send_gap integer default 10,
    advance_day     integer default 30,
    valid           INTEGER default 0       not null
);`

	err = MigrateSQLiteTable(
		"data/site_monitor.db",
		"site_monitor",
		"data/monitor.db",
		"monitor",
		columnMapping,
		createTableSQL,
		1000,
	)
	if err != nil {
		fmt.Println("迁移失败:", err)
	}
}
