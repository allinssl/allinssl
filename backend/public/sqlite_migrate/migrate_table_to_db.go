package sqlite_migrate

import (
	"database/sql"
	"fmt"
	"os"

	_ "modernc.org/sqlite" // 使用 pure Go 实现的 SQLite 驱动
)

func EnsureDatabaseWithTables(targetDBPath string, baseDBPath string, tables []string) error {
	// 1. 检查数据库是否存在
	if _, err := os.Stat(targetDBPath); err == nil {
		fmt.Printf("数据库 %s 已存在，跳过迁移。\n", targetDBPath)
		return nil
	}

	fmt.Printf("数据库 %s 不存在，开始从基础数据库迁移表...\n", targetDBPath)

	// 2. 打开源数据库（只读）和目标数据库（新建）
	baseDB, err := sql.Open("sqlite", baseDBPath)
	if err != nil {
		return fmt.Errorf("打开基础数据库失败: %v", err)
	}
	defer baseDB.Close()

	targetDB, err := sql.Open("sqlite", targetDBPath)
	if err != nil {
		return fmt.Errorf("创建目标数据库失败: %v", err)
	}
	defer targetDB.Close()

	for _, table := range tables {
		// 2.1 获取建表语句
		var createSQL string
		query := "SELECT sql FROM sqlite_master WHERE type='table' AND name=?"
		err = baseDB.QueryRow(query, table).Scan(&createSQL)
		if err != nil {
			return fmt.Errorf("获取表 %s 的结构失败: %v", table, err)
		}

		// 2.2 在目标库中创建表
		_, err = targetDB.Exec(createSQL)
		if err != nil {
			return fmt.Errorf("创建表 %s 失败: %v", table, err)
		}

		// 2.3 从基础库读取数据并插入目标库
		rows, err := baseDB.Query(fmt.Sprintf("SELECT * FROM %s", table))
		if err != nil {
			return fmt.Errorf("读取表 %s 数据失败: %v", table, err)
		}

		cols, _ := rows.Columns()
		values := make([]interface{}, len(cols))
		valuePtrs := make([]interface{}, len(cols))

		tx, _ := targetDB.Begin()
		stmt, _ := tx.Prepare(buildInsertSQL(table, len(cols)))

		for rows.Next() {
			for i := range values {
				valuePtrs[i] = &values[i]
			}
			rows.Scan(valuePtrs...)
			stmt.Exec(values...)
		}

		stmt.Close()
		tx.Commit()
		rows.Close()
	}

	fmt.Println("迁移完成。")
	return nil
}

func buildInsertSQL(table string, numCols int) string {
	placeholders := make([]string, numCols)
	for i := range placeholders {
		placeholders[i] = "?"
	}
	return fmt.Sprintf("INSERT INTO %s VALUES (%s)", table, joinStrings(placeholders, ","))
}

func joinStrings(strs []string, sep string) string {
	result := ""
	for i, s := range strs {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}

// 示例用法
func main() {
	err := EnsureDatabaseWithTables(
		"./target.db",
		"./base.db",
		[]string{"users", "products"}, // 你要迁移的表
	)
	if err != nil {
		fmt.Println("错误:", err)
	}
}
