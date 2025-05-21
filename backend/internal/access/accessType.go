package access

import (
	"ALLinSSL/backend/public"
)

func GetSqliteAT() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "access_type"
	return s, nil
}

func GetAccessTypeMap(key, val string) map[string][]string {
	dataMap := make(map[string][]string)
	s, err := GetSqliteAT()
	if err != nil {
		return dataMap
	}
	defer s.Close()
	data, err := s.Select()
	if err != nil {
		return dataMap
	}
	for _, row := range data {
		if dataMap[row[key].(string)] == nil {
			dataMap[row[key].(string)] = []string{row[val].(string)}
		} else {
			dataMap[row[key].(string)] = append(dataMap[row[key].(string)], row[val].(string))
		}
	}
	return dataMap
}
