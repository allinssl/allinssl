package access

import (
	"ALLinSSL/backend/public"
	"fmt"
	"strings"
	"time"
)

func GetSqlite() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "access"
	return s, nil
}

func GetList(search string, p, limit int64) ([]map[string]any, int, error) {
	var data []map[string]any
	var count int64
	s, err := GetSqlite()
	if err != nil {
		return data, 0, err
	}
	defer s.Close()

	var limits []int64
	if p >= 0 && limit >= 0 {
		limits = []int64{0, limit}
		if p > 1 {
			limits[0] = (p - 1) * limit
			limits[1] = limit
		}
	}
	if search != "" {
		count, err = s.Where("name like ? or type like ?", []interface{}{"%" + search + "%", "%" + search + "%"}).Count()
		data, err = s.Where("name like ? or type like ?", []interface{}{"%" + search + "%", "%" + search + "%"}).Order("update_time", "desc").Limit(limits).Select()
	} else {
		count, err = s.Count()
		data, err = s.Order("update_time", "desc").Limit(limits).Select()
	}

	if err != nil {
		return data, 0, err
	}
	ATMap := GetAccessTypeMap("name", "type")
	for _, v := range data {
		v["access_type"] = ATMap[v["type"].(string)]
	}

	return data, int(count), nil
}

func GetAll(Type string) ([]map[string]any, error) {
	var data []map[string]any
	s, err := GetSqlite()
	if err != nil {
		return data, err
	}
	defer s.Close()

	ATMap := GetAccessTypeMap("type", "name")

	if Type != "" {
		if Type == "dns" {
			TypeL := strings.Join(ATMap["dns"], "','")
			data, err = s.Where(fmt.Sprintf("type in ('%s')", TypeL), []interface{}{}).Select()
		} else {
			Type := strings.Split(strings.TrimPrefix(Type, "-"), "-")[0]
			data, err = s.Where("type = ?", []interface{}{Type}).Select()
		}
	} else {
		data, err = s.Select()
	}
	if err != nil {
		return data, err
	}
	return data, nil
}

func GetAccess(ID string) (map[string]any, error) {
	s, err := GetSqlite()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	data, err := s.Where("id = ?", []interface{}{ID}).Select()
	if err != nil {
		return nil, err
	}
	if len(data) == 0 {
		return nil, fmt.Errorf("API授权不存在：%s", ID)
	}
	return data[0], nil
}

func AddAccess(config, name, typ string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = s.Insert(map[string]any{
		"name":        name,
		"type":        typ,
		"config":      config,
		"create_time": now,
		"update_time": now,
	})
	if err != nil {
		return err
	}
	return nil
}

func UpdateAccess(id, config, name string) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = s.Where("id = ?", []interface{}{id}).Update(map[string]any{
		"name":        name,
		"config":      config,
		"update_time": now,
	})
	if err != nil {
		return err
	}
	return nil
}

func DelAccess(id string) error {
	s, err := GetSqlite()

	if err != nil {
		return err
	}
	defer s.Close()
	_, err = s.Where("id = ?", []interface{}{id}).Delete()
	if err != nil {
		return err
	}
	return nil
}
