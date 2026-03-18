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

// JWTSecret JWT 签名密钥，如果数据库中没有则使用默认值
var JWTSecret = func() string {
	secret := GetSettingIgnoreError("jwt_secret")
	if secret == "" {
		// 生成一个默认的 JWT 密钥（实际使用时建议通过设置接口配置）
		secret = GenerateUUID() + GenerateUUID()
		UpdateSetting("jwt_secret", secret)
	}
	return secret
}()

// JWTExpire JWT 过期时间（秒），默认 24 小时
var JWTExpire = func() int {
	settingStr := GetSettingIgnoreError("jwt_expire")
	setting, err := strconv.Atoi(settingStr)
	if err != nil {
		return 86400 // 24 小时
	}
	return setting
}()

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

	// 重新加载 JWT 配置
	JWTSecret = GetSettingIgnoreError("jwt_secret")
	if JWTSecret == "" {
		JWTSecret = GenerateUUID() + GenerateUUID()
		UpdateSetting("jwt_secret", JWTSecret)
	}

	jwtExpireStr := GetSettingIgnoreError("jwt_expire")
	jwtExpire, err := strconv.Atoi(jwtExpireStr)
	if err != nil {
		JWTExpire = 86400
	} else {
		JWTExpire = jwtExpire
	}
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
