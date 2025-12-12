package access

import (
	"ALLinSSL/backend/public"
	"time"
)

func GetSqliteEAB() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/accounts.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "_eab"
	return s, nil
}

func GetAllEAB(ca string) ([]map[string]any, error) {
	var data []map[string]any
	s, err := GetSqliteEAB()
	if err != nil {
		return data, err
	}
	defer s.Close()
	if ca != "" {
		data, err = s.Where("ca=?", []interface{}{ca}).Order("update_time", "desc").Select()
	} else {
		data, err = s.Order("update_time", "desc").Select()
	}
	if err != nil {
		return data, err
	}
	return data, nil
}

func GetEABList(search string, p, limit int64) ([]map[string]any, int, error) {
	var data []map[string]any
	var count int64
	s, err := GetSqliteEAB()
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
		count, err = s.Where("name like ?", []interface{}{"%" + search + "%"}).Count()
		data, err = s.Where("name like ?", []interface{}{"%" + search + "%"}).Order("update_time", "desc").Limit(limits).Select()
	} else {
		count, err = s.Count()
		data, err = s.Order("update_time", "desc").Limit(limits).Select()
	}
	if err != nil {
		return data, 0, err
	}
	return data, int(count), nil
}

func AddEAB(name, Kid, HmacEncoded, ca, mail string) error {
	s, err := GetSqliteEAB()
	if err != nil {
		return err
	}
	defer s.Close()
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = s.Insert(map[string]interface{}{
		"name":        name,
		"Kid":         Kid,
		"HmacEncoded": HmacEncoded,
		"ca":          ca,
		"update_time": now,
		"create_time": now,
		"mail":        mail,
	})
	return err
}

func UpdEAB(id, name, Kid, HmacEncoded, ca, mail string) error {
	s, err := GetSqliteEAB()
	if err != nil {
		return err
	}
	defer s.Close()
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = s.Where("id=?", []interface{}{id}).Update(map[string]interface{}{
		"name":        name,
		"Kid":         Kid,
		"HmacEncoded": HmacEncoded,
		"ca":          ca,
		"update_time": now,
		"mail":        mail,
	})
	return err
}

func DelEAB(id string) error {
	s, err := GetSqliteEAB()
	if err != nil {
		return err
	}
	defer s.Close()

	_, err = s.Where("id=?", []interface{}{id}).Delete()
	return err
}

func GetEAB(id string) (map[string]interface{}, error) {
	s, err := GetSqliteEAB()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	data, err := s.Where("id = ?", []interface{}{id}).Find()
	if err != nil {
		return nil, err
	}
	return data, nil
}
