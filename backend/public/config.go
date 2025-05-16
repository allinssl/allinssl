package public

import "strconv"

var Port = GetSettingIgnoreError("port")
var Secure = GetSettingIgnoreError("secure")
var SessionKey = GetSettingIgnoreError("session_key")
var LogPath = GetSettingIgnoreError("log_path")
var LoginKey = GenerateUUID()
var TimeOut = func() int {
	settingStr := GetSettingIgnoreError("timeout")
	setting, err := strconv.Atoi(settingStr)
	if err != nil {
		return 3600
	}
	return setting
}()
var ShutdownFunc func()

func ReloadConfig() {
	Port = GetSettingIgnoreError("port")
	Secure = GetSettingIgnoreError("secure")
	SessionKey = GetSettingIgnoreError("session_key")
	LogPath = GetSettingIgnoreError("log_path")

	settingStr := GetSettingIgnoreError("timeout")
	setting, err := strconv.Atoi(settingStr)
	if err != nil {
		TimeOut = 3600
	} else {
		TimeOut = setting
	}
	ShutdownFunc = nil

}

// OpLog 操作日志
type OpLog struct {
	OpType   string `db:"op_type"`
	OpUser   string `db:"op_user"`
	OpTime   string `db:"op_time"`
	OpDetail string `db:"op_detail"`
	OpResult string `db:"op_result"`
	IP       string `db:"ip"`
}
