package module

import (
	"ALLinSSL/backend/public"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
)

type DataChange struct {
	Table  string         `json:"table"`
	Action string         `json:"action"`
	Values map[string]any `json:"values,omitempty"`
	Where  map[string]any `json:"where,omitempty"`
}

type DataResult struct {
	Affected int64 `json:"affected"`
	ID       int64 `json:"id,omitempty"`
}

func (m *Manager) dataAllowed(item *installed, table, action string) bool {
	for _, permission := range item.DataPermissions {
		if permission.Table != table {
			continue
		}
		for _, allowed := range permission.Actions {
			if allowed == action {
				return true
			}
		}
	}
	return false
}

func (m *Manager) serveData(w http.ResponseWriter, r *http.Request) {
	item, p, ok := m.usePlugin(w, r)
	if !ok {
		return
	}
	defer p.active.Done()
	var change DataChange
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&change); err != nil {
		http.Error(w, "数据请求无效", http.StatusBadRequest)
		return
	}
	if !m.dataAllowed(item, change.Table, change.Action) {
		http.Error(w, "没有此表数据权限", http.StatusForbidden)
		return
	}
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	stop := context.AfterFunc(p.ctx, cancel)
	defer stop()
	result, err := m.changeData(ctx, change)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

// changeData 只生成参数化的 INSERT/UPDATE/DELETE，表名和字段名必须来自真实表结构。
func (m *Manager) changeData(ctx context.Context, change DataChange) (DataResult, error) {
	if !tableIdentifier.MatchString(change.Table) || strings.HasPrefix(change.Table, "sqlite_") {
		return DataResult{}, fmt.Errorf("表名无效: %s", change.Table)
	}
	s, err := public.NewSqlite(m.database, "")
	if err != nil {
		return DataResult{}, err
	}
	defer s.Close()
	var name string
	if err := s.Conn.QueryRowContext(ctx, "SELECT name FROM sqlite_master WHERE type='table' AND name=?", change.Table).Scan(&name); err != nil {
		return DataResult{}, fmt.Errorf("表不存在: %s", change.Table)
	}
	columns, err := dataColumns(ctx, s, change.Table)
	if err != nil {
		return DataResult{}, err
	}
	switch change.Action {
	case "insert":
		keys, err := dataFields(columns, change.Values)
		if err != nil {
			return DataResult{}, err
		}
		values := make([]any, len(keys))
		placeholders := make([]string, len(keys))
		for index, key := range keys {
			values[index] = change.Values[key]
			placeholders[index] = "?"
		}
		result, err := s.Conn.ExecContext(ctx, "INSERT INTO "+dataIdentifier(change.Table)+" ("+dataIdentifiers(keys)+") VALUES ("+strings.Join(placeholders, ",")+")", values...)
		if err != nil {
			return DataResult{}, err
		}
		id, _ := result.LastInsertId()
		return DataResult{Affected: 1, ID: id}, nil
	case "update":
		if len(change.Where) == 0 {
			return DataResult{}, fmt.Errorf("更新数据必须指定条件")
		}
		keys, err := dataFields(columns, change.Values)
		if err != nil {
			return DataResult{}, err
		}
		whereKeys, err := dataFields(columns, change.Where)
		if err != nil {
			return DataResult{}, err
		}
		values := make([]any, 0, len(keys)+len(whereKeys))
		sets := make([]string, len(keys))
		for index, key := range keys {
			sets[index] = dataIdentifier(key) + "=?"
			values = append(values, change.Values[key])
		}
		for _, key := range whereKeys {
			values = append(values, change.Where[key])
		}
		result, err := s.Conn.ExecContext(ctx, "UPDATE "+dataIdentifier(change.Table)+" SET "+strings.Join(sets, ",")+" WHERE "+dataConditions(whereKeys), values...)
		if err != nil {
			return DataResult{}, err
		}
		affected, _ := result.RowsAffected()
		return DataResult{Affected: affected}, nil
	case "delete":
		if len(change.Where) == 0 {
			return DataResult{}, fmt.Errorf("删除数据必须指定条件")
		}
		whereKeys, err := dataFields(columns, change.Where)
		if err != nil {
			return DataResult{}, err
		}
		values := make([]any, len(whereKeys))
		for index, key := range whereKeys {
			values[index] = change.Where[key]
		}
		result, err := s.Conn.ExecContext(ctx, "DELETE FROM "+dataIdentifier(change.Table)+" WHERE "+dataConditions(whereKeys), values...)
		if err != nil {
			return DataResult{}, err
		}
		affected, _ := result.RowsAffected()
		return DataResult{Affected: affected}, nil
	default:
		return DataResult{}, fmt.Errorf("不支持的数据动作: %s", change.Action)
	}
}

func dataColumns(ctx context.Context, s *public.Sqlite, table string) (map[string]bool, error) {
	rows, err := s.Conn.QueryContext(ctx, "PRAGMA table_info("+dataIdentifier(table)+")")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	columns := map[string]bool{}
	for rows.Next() {
		var cid, notNull, pk int
		var name, typ string
		var defaultValue any
		if err := rows.Scan(&cid, &name, &typ, &notNull, &defaultValue, &pk); err != nil {
			return nil, err
		}
		columns[name] = true
	}
	return columns, rows.Err()
}

func dataFields(columns map[string]bool, values map[string]any) ([]string, error) {
	if len(values) == 0 {
		return nil, fmt.Errorf("数据字段不能为空")
	}
	keys := make([]string, 0, len(values))
	for key := range values {
		if !columns[key] {
			return nil, fmt.Errorf("字段不存在: %s", key)
		}
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys, nil
}

func dataConditions(keys []string) string {
	conditions := make([]string, len(keys))
	for index, key := range keys {
		conditions[index] = dataIdentifier(key) + "=?"
	}
	return strings.Join(conditions, " AND ")
}

func dataIdentifier(name string) string {
	return `"` + name + `"`
}

func dataIdentifiers(names []string) string {
	quoted := make([]string, len(names))
	for index, name := range names {
		quoted[index] = dataIdentifier(name)
	}
	return strings.Join(quoted, ",")
}
