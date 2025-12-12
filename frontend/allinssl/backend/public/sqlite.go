package public

import (
	"database/sql"
	"errors"
	"fmt"
	_ "modernc.org/sqlite"
	"os"
	"strconv"
	"strings"
)

/*
*

  - @brief Sqlite对象
    示例：
    fmt.Println(data)
*/
type Sqlite struct {
	DbFile     string
	PreFix     string
	TableName  string
	Conn       *sql.DB
	JoinTable  []string
	JoinOn     []string
	JoinType   []string
	JoinParam  []interface{}
	OptField   []string
	OptLimit   string
	OptWhere   string
	OptOrder   string
	OptParam   []interface{}
	OptGroupBy string
	OptHaving  string
	Tx         *sql.Tx
	TxErr      error
	Sql        string
	closed     bool
}

/**
 * @brief 实例化Sqlite对象
 * @param DbFile string 数据库文件
 * @param PreFix string 表前缀
 * @return *Sqlite 实例化的Sqlite对象
 * @return error 错误信息
 */
func NewSqlite(DbFile string, PreFix string) (*Sqlite, error) {
	s := Sqlite{}
	s.DbFile = DbFile
	s.PreFix = PreFix
	s.closed = true
	if !FileExists(DbFile) {
		return nil, errors.New("错误：指定数据库文件不存在")
	}
	err := s.Connect()
	if err != nil {
		return nil, err
	}

	return &s, nil
}

func FileExists(file string) bool {
	_, err := os.Stat(file)
	if err == nil {
		return true
	}
	return false
}

/**
 * @brief 连接数据库
 * @return error 错误信息
 */
func (s *Sqlite) Connect() error {
	dsn := fmt.Sprintf("file:%s?_pragma=busy_timeout(60000)", s.DbFile)
	conn, err := sql.Open("sqlite", dsn)
	if err == nil {
		s.Conn = conn
		s.closed = false

	}
	return err
}

/**
 * @brief 关闭数据库连接
 */
func (s *Sqlite) Close() {
	s.Conn.Close()
	s.closed = true
	s.Tx = nil
}

/**
 * @brief 设置数据库主机地址
 * @param Host string 主机地址
 * @param Port int 端口号
 * @return void
 */
func (s *Sqlite) SetDbFile(DbFile string) {
	if !FileExists(DbFile) {
		panic("错误：指定数据库文件不存在")
	}
	s.DbFile = DbFile
}

/**
 * @brief 设置要操作的表名
 * @param tableName string 表名
 * @return *Sqlite 实例化的Sqlite对象
 */
func (s *Sqlite) Table(tableName string) *Sqlite {
	s.TableName = s.PreFix + tableName
	return s
}

/**
 * @brief 设置要返回的字段
 * @param field []string 字段名数组
 * @return *Sqlite 实例化的Sqlite对象
 */
func (s *Sqlite) Field(field []string) *Sqlite {
	s.OptField = field
	return s
}

/**
 * @brief 设置取回行数
 * @param limit []int64 ,limit[0]为起始行数，limit[1]为取回行数
 * @return *Sqlite 实例化的Sqlite对象
 */
func (s *Sqlite) Limit(limit []int64) *Sqlite {
	last_limit := " LIMIT "
	limit_len := len(limit)
	if limit_len == 0 {
		s.OptLimit = ""
	} else if limit_len == 1 {
		s.OptLimit = last_limit + strconv.FormatInt(limit[0], 10)
	} else if limit_len >= 2 {
		s.OptLimit = last_limit + strconv.FormatInt(limit[0], 10) + "," + strconv.FormatInt(limit[1], 10)
	} else {
		s.OptLimit = ""
	}
	return s
}

/**
 * @brief 设置排序
 * @param fieldName string 字段名
 * @param sortOrder string 排序方式，ASC为升序，DESC为降序
 * @return *Sqlite 实例化的Sqlite对象
 */
func (s *Sqlite) Order(fieldName string, sortOrder string) *Sqlite {
	sortOrder = strings.ToUpper(sortOrder)
	if sortOrder != "ASC" && sortOrder != "DESC" {
		sortOrder = "ASC"
	}
	s.OptOrder = " ORDER BY " + fieldName + " " + sortOrder
	return s
}

/**
 * @brief 设置排序
 * @param fieldName string 字段名
 * @param sortOrder string 排序方式，ASC为升序，DESC为降序
 * @return *Sqlite 实例化的Sqlite对象
 */
func (s *Sqlite) Sort(fieldName string, sortOrder string) *Sqlite {
	return s.Order(fieldName, sortOrder)
}

/**
 * @brief 设置查询条件
 * @param where string 查询条件
 * @param param []interface{} 查询条件参数
 * @return *Sqlite 实例化的Sqlite对象
 */
func (s *Sqlite) Where(where string, param []interface{}) *Sqlite {
	s.OptWhere = " WHERE " + where
	s.OptParam = param
	return s
}

/**
 * @brief 获取查询字段
 * @return string 查询字段
 */
func (s *Sqlite) getField() string {
	field := "*"
	if len(s.OptField) > 0 {
		field = strings.Join(s.OptField, ",")
	}
	return field
}

func (s *Sqlite) getJoinOn(sql string) string {
	// 处理JOIN
	for i := 0; i < len(s.JoinTable); i++ {
		if s.JoinTable[i] == "" {
			continue
		}

		// 处理JOIN类型
		if s.JoinType[i] != "" {
			s.JoinType[i] = " " + s.JoinType[i]
		}

		// 拼接JOIN ON
		sql += " " + s.JoinType[i] + " JOIN " + s.JoinTable[i] + " ON " + s.JoinOn[i]
	}

	// 处理JOIN参数
	if s.JoinParam != nil {
		joinParamLen := len(s.JoinParam)
		optParamLen := len(s.OptParam)
		params := make([]interface{}, 0)
		if joinParamLen > 0 {
			params = append(params, s.JoinParam...)
		}
		if optParamLen > 0 {
			params = append(params, s.JoinParam...)
		}

		s.OptParam = params
	}
	return sql
}

/**
 * @brief 获取查询条件
 * @param sql string sql语句
 * @return string 拼接查询条件后的sql语句
 */
func (s *Sqlite) getWhere(sql string) string {
	if s.OptWhere != "" {
		sql += s.OptWhere
	}
	return sql
}

func (s *Sqlite) getGroup(sql string) string {
	if s.OptGroupBy != "" {
		sql += " " + s.OptGroupBy + " "
	}
	return sql
}

/**
 * @brief 获取排序
 * @param sql string sql语句
 * @return string 拼接排序后的sql语句
 */
func (s *Sqlite) getOrder(sql string) string {
	if s.OptOrder != "" {
		sql += s.OptOrder
	}
	return sql
}

/**
 * @brief 获取行数
 * @param sql string sql语句
 * @return string 拼接行数后的sql语句
 */
func (s *Sqlite) getLimit(sql string) string {
	if s.OptLimit != "" {
		sql += s.OptLimit
	}
	return sql
}

func (s *Sqlite) checkParam(sql string, param []interface{}) error {
	// 检查参数数量
	sqlCount := strings.Count(sql, "?")
	paramCount := len(param)

	if sqlCount != paramCount {
		return errors.New("参数数量不匹配，要求绑定" + strconv.Itoa(sqlCount) + "个参数，实际绑定" + strconv.Itoa(paramCount) + "个参数")
	}
	return nil
}

/**
 * @brief 获取数据集
 * @return []map[string]interface{} 数据集
 */
func (s *Sqlite) Select() ([]map[string]interface{}, error) {
	if s.TableName == "" {
		return nil, errors.New("错误：未指定要操作的表名")
	}
	field := s.getField()

	s.Sql = "SELECT " + field + " FROM " + s.TableName

	s.Sql = s.getJoinOn(s.Sql)
	s.Sql = s.getWhere(s.Sql)
	s.Sql = s.getGroup(s.Sql)
	s.Sql = s.getOrder(s.Sql)
	s.Sql = s.getLimit(s.Sql)
	defer s.clearOpt()
	// fmt.Println(s.Sql, s.OptParam)

	// 检查参数数量
	err := s.checkParam(s.Sql, s.OptParam)
	if err != nil {
		return nil, err
	}

	// 清空参数
	rows, err := s.Conn.Query(s.Sql, s.OptParam...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	columns, _ := rows.Columns()
	count := len(columns)
	values := make([]interface{}, count)
	valuePtrs := make([]interface{}, count)
	var result []map[string]interface{}
	for rows.Next() {
		for i := 0; i < count; i++ {
			valuePtrs[i] = &values[i]
		}
		rows.Scan(valuePtrs...)
		row := make(map[string]interface{})
		for i, col := range columns {
			var v interface{}
			val := values[i]
			b, ok := val.([]byte)
			if ok {
				v = string(b)
			} else {
				v = val
			}
			row[col] = v
		}
		result = append(result, row)
	}
	return result, err
}

/**
 * @brief 插入数据
 * @param data map[string]interface{} 要插入的数据
 * @return int64 插入的数据ID
 * @return error 错误信息
 */
func (s *Sqlite) Insert(data map[string]interface{}) (int64, error) {

	if s.TableName == "" {
		return 0, errors.New("错误：未指定要操作的表名")
	}

	var keys []string
	var values []interface{}
	var placeholders []string
	for k, v := range data {
		keys = append(keys, k)
		values = append(values, v)
		placeholders = append(placeholders, "?")
	}

	// 清空参数
	defer s.clearOpt()

	s.Sql = "INSERT INTO " + s.TableName + " (" + strings.Join(keys, ",") + ") VALUES (" + strings.Join(placeholders, ",") + ")"
	stmt, err := s.Conn.Prepare(s.Sql)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()
	res, err := stmt.Exec(values...)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()

	return id, err
}

/**
 * @brief 更新数据
 * @param data map[string]interface{} 要更新的数据
 * @return int64 影响的行数
 * @return error 错误信息
 */
func (s *Sqlite) Update(data map[string]interface{}) (int64, error) {
	if s.TableName == "" {
		return 0, errors.New("错误：未指定要操作的表名")
	}
	var keys []string
	var values []interface{}
	for k, v := range data {
		keys = append(keys, k)
		values = append(values, v)
	}
	s.Sql = "UPDATE " + s.TableName + " SET " + strings.Join(keys, "=?,") + "=?"
	if s.OptWhere != "" {
		s.Sql += s.OptWhere
	}

	// 清空参数
	defer s.clearOpt()

	stmt, err := s.Conn.Prepare(s.Sql)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()
	values = append(values, s.OptParam...)

	// 检查参数数量
	err = s.checkParam(s.Sql, values)
	if err != nil {
		return 0, err
	}

	res, err := stmt.Exec(values...)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

/**
 * @brief 插入更新
 * @param data map[string]interface{} 要更新的数据
 * @param uniqueIdx 依据的唯一索引的字段信息，如果数据库中不存在该索引，则会出现报错 如：(date, uri_id)
 * @param updateFormula 更新字段的表达式，如: request = request + excluded.request
 * @return int64 影响的行数
 * @return error 错误信息
 */
func (s *Sqlite) Upsert(uniqueIdx []string, data map[string]interface{}, updateFormula string) (int64, error) {
	if s.TableName == "" {
		return 0, errors.New("错误：未指定要操作的表名")
	}

	var keys []string
	var values []interface{}
	placeholdersBuilder := strings.Builder{}
	var first = true
	for k, v := range data {
		keys = append(keys, k)
		values = append(values, v)
		if first {
			placeholdersBuilder.Write([]byte("?"))
			first = false
		} else {
			placeholdersBuilder.Write([]byte(",?"))
		}
	}
	placeholders := placeholdersBuilder.String()

	// 清空参数
	defer s.clearOpt()

	s.Sql = fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s) ON CONFLICT (%s) DO UPDATE SET %s",
		s.TableName, strings.Join(keys, ","), placeholders, strings.Join(uniqueIdx, ","), updateFormula)
	stmt, err := s.Conn.Prepare(s.Sql)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()
	res, err := stmt.Exec(values...)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()

	return id, err
}

/**
 * @brief 删除数据
 * @return int64 影响的行数
 * @return error 错误信息
 */
func (s *Sqlite) Delete() (int64, error) {
	if s.TableName == "" {
		return 0, errors.New("错误：未指定要操作的表名")
	}
	s.Sql = "DELETE FROM " + s.TableName
	if s.OptWhere != "" {
		s.Sql += s.OptWhere
	}

	// 清空参数
	defer s.clearOpt()

	// 检查参数数量
	err := s.checkParam(s.Sql, s.OptParam)
	if err != nil {
		return 0, err
	}

	// 预编译SQL语句
	stmt, err := s.Conn.Prepare(s.Sql)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	// 执行SQL语句
	res, err := stmt.Exec(s.OptParam...)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

/**
 * @brief 获取一条数据
 * @return sap[string]interface{} 数据集
 * @return error 错误信息
 */
func (s *Sqlite) Find() (map[string]interface{}, error) {
	s.Limit([]int64{1})
	result, err := s.Select()
	if err != nil {
		return nil, err
	}

	if len(result) > 0 {
		return result[0], nil
	}

	return nil, errors.New("not found")
}

/**
 * @brief 获取总数
 * @return int64 总数
 * @return error 错误信息
 */
func (s *Sqlite) Count() (int64, error) {
	if s.TableName == "" {
		return 0, errors.New("错误：未指定要操作的表名")
	}
	s.Sql = "SELECT COUNT(*) FROM " + s.TableName
	if s.OptWhere != "" {
		s.Sql += s.OptWhere
	}
	defer s.clearOpt()

	// 检查参数数量
	err := s.checkParam(s.Sql, s.OptParam)
	if err != nil {
		return 0, err
	}

	// 执行SQL语句
	rows, err := s.Conn.Query(s.Sql, s.OptParam...)
	if err != nil {
		return 0, err
	}
	defer rows.Close()
	var count int64
	for rows.Next() {
		rows.Scan(&count)
	}
	return count, err
}

// CountField 获取指定字段的总数
func (s *Sqlite) CountField(field string) (int64, error) {
	if s.TableName == "" {
		return 0, errors.New("错误：未指定要操作的表名")
	}
	if field == "" {
		field = "*"
	}
	s.Sql = "SELECT COUNT(" + field + ") FROM " + s.TableName
	if s.OptWhere != "" {
		s.Sql += s.OptWhere
	}
	defer s.clearOpt()

	// 检查参数数量
	err := s.checkParam(s.Sql, s.OptParam)
	if err != nil {
		return 0, err
	}

	// 执行SQL语句
	rows, err := s.Conn.Query(s.Sql, s.OptParam...)
	if err != nil {
		return 0, err
	}
	defer rows.Close()
	var count int64
	for rows.Next() {
		rows.Scan(&count)
	}
	return count, err
}

// CountFields 获取多个字段的统计总数
func (s *Sqlite) CountFields(fields []string) ([]int64, error) {
	if s.TableName == "" {
		return nil, errors.New("错误：未指定要操作的表名")
	}
	countStrBuilder := strings.Builder{}
	if len(fields) == 0 {
		return nil, errors.New("错误：未指定要统计的字段")
	} else {
		for _, field := range fields {
			if countStrBuilder.Len() > 0 {
				countStrBuilder.WriteByte(',')
			}
			countStrBuilder.WriteString(fmt.Sprintf("COUNT(%s)", field))
		}
	}
	s.Sql = "SELECT " + countStrBuilder.String() + " FROM " + s.TableName
	if s.OptWhere != "" {
		s.Sql += s.OptWhere
	}
	defer s.clearOpt()

	// 检查参数数量
	err := s.checkParam(s.Sql, s.OptParam)
	if err != nil {
		return nil, err
	}

	// 执行SQL语句
	rows, err := s.Conn.Query(s.Sql, s.OptParam...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	countList := make([]int64, len(fields))
	tmpList := make([]any, len(fields))
	for i := 0; i < len(fields); i++ {
		tmpList[i] = &countList[i]
	}

	for rows.Next() {
		rows.Scan(tmpList...)
	}
	return countList, err
}

/**
 * @brief 获取指定字段的值
 * @param field string 字段名
 * @return interface{} 字段值
 * @return error 错误信息
 */
func (s *Sqlite) Value(field string) (interface{}, error) {
	s.Field([]string{field})
	s.Limit([]int64{1})
	result, err := s.Select()
	if err != nil {
		return nil, err
	}

	if len(result) > 0 {
		return result[0][field], nil
	}

	return nil, errors.New("not found")
}

/**
 * @brief 设置指定字段的值
 * @param field string 字段名
 * @param value interface{} 字段值
 * @return int64 影响的行数
 * @return error 错误信息
 */
func (s *Sqlite) SetValue(field string, value interface{}) (int64, error) {
	data := make(map[string]interface{})
	data[field] = value
	return s.Update(data)
}

/**
 * @brief 启动事务
 * @return error 错误信息
 */
func (s *Sqlite) Begin() (*sql.Tx, error) {
	s.Tx, s.TxErr = s.Conn.Begin()
	return s.Tx, s.TxErr
}

/**
 * @brief 使用事务批量插入数据
 * @param values [][]interface{} 要插入的数据 二维数组,每个数组为一条数据，数组中的值为字段值，顺序与keys对应
 * @param keys []string 字段名
 * @return int 影响的行数
 * @return error 错误信息
 */
func (s *Sqlite) InsertBegin(values [][]interface{}, keys []string) (int, []int64, error) {
	if s.TableName == "" {
		return 0, nil, errors.New("错误：未指定要操作的表名")
	}
	var placeholders []string
	// 遍历数据
	for range keys {
		placeholders = append(placeholders, "?")
	}

	// 启动事务
	s.Tx, s.TxErr = s.Conn.Begin()
	if s.TxErr != nil {
		return 0, nil, s.TxErr
	}

	// 清空参数
	defer s.clearOpt()

	// 预编译SQL语句
	s.Sql = "INSERT INTO " + s.TableName + " (" + strings.Join(keys, ",") + ") VALUES (" + strings.Join(placeholders, ",") + ")"
	stmt, err := s.Tx.Prepare(s.Sql)
	if err != nil {
		return 0, nil, err
	}
	defer func(stmt *sql.Stmt) {
		err := stmt.Close()
		if err != nil {
			println("结束报错", err.Error())
		}
	}(stmt)

	// 执行SQL语句
	insertIds := make([]int64, 0, len(values))
	ok := 0
	for _, val := range values {
		tmp, err := stmt.Exec(val...)
		if err != nil {
			// 显示回滚任务， 避免数据库事务未完成导致资源占
			err2 := s.Tx.Rollback()
			s.Tx = nil
			if err2 != nil {
				fmt.Println("回滚报错", err2.Error())
			}
			return 0, nil, err
		}
		tmpId, _ := tmp.LastInsertId()
		insertIds = append(insertIds, tmpId)
		ok++
	}

	// 提交事务
	err = s.Tx.Commit()
	s.Tx = nil

	return ok, insertIds, err
}

/**
 * @brief 使用事务批量插入数据 并忽略 可能出现的唯一索引错误的问题
 * @param values [][]interface{} 要插入的数据 二维数组,每个数组为一条数据，数组中的值为字段值，顺序与keys对应
 * @param keys []string 字段名
 * @return int 影响的行数
 * @return error 错误信息
 */
func (s *Sqlite) InsertOrIgnoreBegin(values [][]interface{}, keys []string) (int, []int64, error) {
	if s.TableName == "" {
		return 0, nil, errors.New("错误：未指定要操作的表名")
	}
	var placeholders []string
	// 遍历数据
	for range keys {
		placeholders = append(placeholders, "?")
	}

	// 启动事务
	s.Tx, s.TxErr = s.Conn.Begin()
	if s.TxErr != nil {
		return 0, nil, s.TxErr
	}

	// 清空参数
	defer s.clearOpt()

	// 预编译SQL语句
	s.Sql = "INSERT OR IGNORE INTO " + s.TableName + " (" + strings.Join(keys, ",") + ") VALUES (" + strings.Join(placeholders, ",") + ")"
	stmt, err := s.Tx.Prepare(s.Sql)
	if err != nil {
		return 0, nil, err
	}
	defer func(stmt *sql.Stmt) {
		err := stmt.Close()
		if err != nil {
			println("结束报错", err.Error())
		}
	}(stmt)

	// 执行SQL语句
	insertIds := make([]int64, 0, len(values))
	ok := 0
	for _, val := range values {
		tmp, err := stmt.Exec(val...)
		if err != nil {
			// 显示回滚任务， 避免数据库事务未完成导致资源占
			err2 := s.Tx.Rollback()
			s.Tx = nil
			if err2 != nil {
				fmt.Println("回滚报错", err2.Error())
			}
			return 0, nil, err
		}
		tmpId, _ := tmp.LastInsertId()
		insertIds = append(insertIds, tmpId)
		ok++
	}

	// 提交事务
	err = s.Tx.Commit()
	s.Tx = nil

	return ok, insertIds, err
}

/**
 * @brief 使用事务批量插入更新数据
 * @param values [][]interface{} 要插入的数据 二维数组,每个数组为一条数据，数组中的值为字段值，顺序与keys对应
 * @param keys []string 字段名
 * @param uniqueIdx 依据的唯一索引的字段信息，如果数据库中不存在该索引，则会出现报错 如：(date, uri_id)
 * @param updateFormula 更新字段的表达式，如: request = request + excluded.request
 * @return int 影响的行数
 * @return error 错误信息
 */
func (s *Sqlite) UpsertBegin(values [][]interface{}, keys []string, uniqueIdx []string, updateFormula string) (int, error) {
	if s.TableName == "" {
		return 0, errors.New("错误：未指定要操作的表名")
	}
	placeholdersBuilder := strings.Builder{}
	var first = true
	for range keys {
		if first {
			placeholdersBuilder.Write([]byte("?"))
			first = false
		} else {
			placeholdersBuilder.Write([]byte(",?"))
		}
	}
	placeholders := placeholdersBuilder.String()

	// 启动事务
	s.Tx, s.TxErr = s.Conn.Begin()
	if s.TxErr != nil {
		return 0, s.TxErr
	}

	// 清空参数
	defer s.clearOpt()

	// 预编译SQL语句
	s.Sql = fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s) ON CONFLICT (%s) DO UPDATE SET %s",
		s.TableName, strings.Join(keys, ","), placeholders, strings.Join(uniqueIdx, ","), updateFormula)

	stmt, err := s.Tx.Prepare(s.Sql)
	if err != nil {
		return 0, err
	}
	defer func(stmt *sql.Stmt) {
		err := stmt.Close()
		if err != nil {
			println("结束报错", err.Error())
		}
	}(stmt)

	// 执行SQL语句
	ok := 0
	for _, val := range values {
		_, err = stmt.Exec(val...)
		if err != nil {
			// 显示回滚任务， 避免数据库事务未完成导致资源占
			err2 := s.Tx.Rollback()
			s.Tx = nil
			if err2 != nil {
				fmt.Println("回滚报错", err2.Error())
			}
			return 0, err
		}
		ok++
	}

	// 提交事务
	err = s.Tx.Commit()
	s.Tx = nil

	return ok, err
}

/**
 * @brief 回滚事务
 * @return error 错误信息
 */
func (s *Sqlite) Rollback() error {
	err := s.Tx.Rollback()
	s.Tx = nil
	return err
}

/**
 * @brief 提交事务
 * @return error 错误信息
 */
func (s *Sqlite) Commit() error {
	err := s.Tx.Commit()
	s.Tx = nil
	return err
}

/**
 * @brief 设置JOIN查询
 * @param joinType string JOIN类型
 * @param table string JOIN表名
 * @param on string JOIN条件
 * @param param []interface{} JOIN参数
 * @return *Sqlite
 */
func (s *Sqlite) Join(joinType string, table string, on string, param []interface{}) *Sqlite {
	joinType = strings.ToUpper(joinType)
	if joinType != "LEFT" && joinType != "RIGHT" && joinType != "INNER" && joinType != "OUTER" {
		joinType = "LEFT"
	}

	if s.JoinTable == nil {
		s.JoinTable = make([]string, 0)
	}
	s.JoinTable = append(s.JoinTable, s.PreFix+table)

	if s.JoinOn == nil {
		s.JoinOn = make([]string, 0)
	}
	s.JoinOn = append(s.JoinOn, on)

	if s.JoinType == nil {
		s.JoinType = make([]string, 0)
	}
	s.JoinType = append(s.JoinType, joinType)

	if s.JoinParam == nil {
		s.JoinParam = make([]interface{}, 0)
	}

	if len(param) > 0 {
		if param[0] != nil {
			s.JoinParam = append(s.JoinParam, param...)
		}
	}

	return s
}

/**
 * @brief 设置GROUP BY
 * @param groupBy string GROUP BY
 * @return *Sqlite
 */
func (s *Sqlite) GroupBy(groupBy string) *Sqlite {
	s.OptGroupBy = " GROUP BY " + groupBy
	return s
}

/**
 * @brief 设置HAVING
 * @param having string HAVING
 * @return *Sqlite
 */
func (s *Sqlite) Having(having string) *Sqlite {
	s.OptHaving = " HAVING " + having
	return s
}

// /**
// * @brief 设置Group分组
// * @param group string GROUP
// * @return *Sqlite
// */
// func (s *Sqlite) Group(group string) *Sqlite {
//	s.OptGroupBy = " " + group
//	return s
// }

/**
 * @brief 使用SQL语句查询
 * @param sql string SQL语句
 * @param param []interface{} 绑定参数
 * @return []map[string]interface{} 数据集
 * @return error 错误信息
 */
func (s *Sqlite) Query(sql string, param ...interface{}) ([]map[string]interface{}, error) {

	// 检查参数数量
	err := s.checkParam(s.Sql, s.OptParam)
	if err != nil {
		return nil, err
	}

	// 执行SQL语句
	rows, err := s.Conn.Query(sql, param...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	count := len(columns)
	values := make([]interface{}, count)
	valuePtrs := make([]interface{}, count)

	var result []map[string]interface{}
	for rows.Next() {
		for i := 0; i < count; i++ {
			valuePtrs[i] = &values[i]
		}

		rows.Scan(valuePtrs...)

		row := make(map[string]interface{})
		for i, col := range columns {
			var v interface{}
			val := values[i]

			b, ok := val.([]byte)
			if ok {
				v = string(b)
			} else {
				v = val
			}

			row[col] = v
		}

		result = append(result, row)
	}

	return result, nil
}

/**
 * @brief 执行SQL语句
 * @param sql string SQL语句
 * @param param []interface{} 绑定参数
 * @return int64 影响的行数
 * @return error 错误信息
 */
func (s *Sqlite) Exec(sql string, param ...interface{}) (int64, error) {
	// 检查参数数量
	err := s.checkParam(s.Sql, s.OptParam)
	if err != nil {
		return 0, err
	}
	// 预编译SQL语句
	stmt, err := s.Conn.Prepare(sql)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	// 执行SQL语句
	res, err := stmt.Exec(param...)
	if err != nil {
		return 0, err
	}

	// 返回影响的行数
	return res.RowsAffected()
}

/**
 * @brief 清空查询条件
 * @return void
 */
func (s *Sqlite) clearOpt() {
	s.OptField = nil
	s.OptGroupBy = ""
	s.OptWhere = ""
	s.OptOrder = ""
	s.OptLimit = ""
	s.OptParam = nil
	s.JoinOn = nil
	s.JoinTable = nil
	s.JoinType = nil
	s.JoinParam = nil
	s.Sql = ""
}

func (s *Sqlite) IsClosed() bool {
	return s.closed
}
