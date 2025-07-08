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
		// fmt.Printf("数据库 %s 已存在，跳过迁移。\n", targetDBPath)
		return nil
	}

	// fmt.Printf("数据库 %s 不存在，开始从基础数据库迁移表...\n", targetDBPath)

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
			return nil
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

	// fmt.Println("迁移完成。")
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

// MigrateSQLiteTable 迁移方法
func MigrateSQLiteTable(sourceDBPath, sourceTable, targetDBPath, targetTable string, columnMapping map[string]string, createTableSQL string, batchSize int) error {
	// 打开目标数据库
	targetDB, err := sql.Open("sqlite", targetDBPath)
	if err != nil {
		//return fmt.Errorf("打开目标数据库失败: %v", err)
	}
	defer targetDB.Close()

	// 检查目标表
	exists, err := tableExists(targetDB, targetTable)
	if err != nil {
		return err
	}
	if exists {
		//fmt.Printf("目标表 %s 已存在，跳过迁移。\n", targetTable)
		return nil
	}

	// 创建目标表
	//fmt.Printf("目标表 %s 不存在，正在创建...\n", targetTable)
	if _, err := targetDB.Exec(createTableSQL); err != nil {
		//return fmt.Errorf("创建目标表失败: %v", err)
	}
	fmt.Printf("目标表 %s 创建成功。\n", targetTable)

	// 打开源数据库
	sourceDB, err := sql.Open("sqlite", sourceDBPath)
	if err != nil {
		//return fmt.Errorf("打开源数据库失败: %v", err)
	}
	defer sourceDB.Close()

	// 检查源表
	exists, err = tableExists(sourceDB, sourceTable)
	if err != nil {
		return err
	}
	if !exists {
		//return fmt.Errorf("源表 %s 不存在，迁移终止", sourceTable)
	}

	// 构建列映射
	sourceCols, targetCols, placeholders := buildColumnMappings(columnMapping)

	selectSQL := fmt.Sprintf("SELECT %s FROM %s", sourceCols, sourceTable)
	insertSQL := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", targetTable, targetCols, placeholders)

	rows, err := sourceDB.Query(selectSQL)
	if err != nil {
		//return fmt.Errorf("查询源数据失败: %v", err)
	}
	defer rows.Close()

	stmt, err := targetDB.Prepare(insertSQL)
	if err != nil {
		//return fmt.Errorf("准备插入语句失败: %v", err)
	}
	defer stmt.Close()

	colCount := len(columnMapping)
	batch := make([][]interface{}, 0, batchSize)
	total := 0

	for rows.Next() {
		values := make([]interface{}, colCount)
		ptrs := make([]interface{}, colCount)
		for i := range ptrs {
			ptrs[i] = &values[i]
		}

		if err := rows.Scan(ptrs...); err != nil {
			//return fmt.Errorf("读取行数据失败: %v", err)
		}

		batch = append(batch, values)
		total++

		if len(batch) >= batchSize {
			if err := insertBatch(targetDB, stmt, batch); err != nil {
				return err
			}
			batch = batch[:0]
		}
	}

	if len(batch) > 0 {
		if err := insertBatch(targetDB, stmt, batch); err != nil {
			return err
		}
	}

	//fmt.Printf("数据迁移完成，共迁移 %d 条记录。\n", total)
	return nil
}

// tableExists 检查表是否存在
func tableExists(db *sql.DB, tableName string) (bool, error) {
	query := `SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?`
	var count int
	if err := db.QueryRow(query, tableName).Scan(&count); err != nil {
		return false, fmt.Errorf("检查表是否存在失败: %v", err)
	}
	return count > 0, nil
}

// buildColumnMappings 构建列映射 SQL 片段
func buildColumnMappings(mapping map[string]string) (string, string, string) {
	srcCols := ""
	tgtCols := ""
	placeholders := ""
	i := 0
	for src, tgt := range mapping {
		if i > 0 {
			srcCols += ", "
			tgtCols += ", "
			placeholders += ", "
		}
		srcCols += src
		tgtCols += tgt
		placeholders += "?"
		i++
	}
	return srcCols, tgtCols, placeholders
}

// insertBatch 批量插入数据
func insertBatch(db *sql.DB, stmt *sql.Stmt, batch [][]interface{}) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("开启事务失败: %v", err)
	}
	for _, vals := range batch {
		if _, err := tx.Stmt(stmt).Exec(vals...); err != nil {
			tx.Rollback()
			return fmt.Errorf("插入数据失败: %v", err)
		}
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("提交事务失败: %v", err)
	}
	return nil
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
