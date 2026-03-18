package api

import (
	"ALLinSSL/backend/public"
	"crypto/md5"
	"encoding/hex"
	"github.com/gin-gonic/gin"
	"strconv"
	"strings"
	"time"
)

// TokenRequest 生成 Token 请求
type TokenRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// GenerateToken 生成 JWT Token（供外部 API 调用）
// POST /v1/token/generate
// Body: {"username": "admin", "password": "password"}
// 或 form: username=admin&password=password
// Response: {"code": 0, "data": {"token": "xxx", "expire": 86400}}
func GenerateToken(c *gin.Context) {
	var req TokenRequest
	
	// 先尝试 JSON 绑定，失败则尝试 form 绑定
	if err := c.ShouldBindJSON(&req); err != nil {
		if err := c.ShouldBind(&req); err != nil {
			public.FailMsg(c, "参数错误："+err.Error())
			return
		}
	}

	if req.Username == "" || req.Password == "" {
		public.FailMsg(c, "用户名和密码不能为空")
		return
	}

	req.Username = strings.TrimSpace(req.Username)

	// 从数据库验证用户
	s, err := public.NewSqlite("data/settings.db", "")
	if err != nil {
		public.FailMsg(c, "数据库错误："+err.Error())
		return
	}
	defer s.Close()

	s.TableName = "users"
	res, err := s.Where("username=?", []interface{}{req.Username}).Select()
	if err != nil {
		public.FailMsg(c, "查询用户失败："+err.Error())
		return
	}

	if len(res) == 0 {
		public.FailMsg(c, "用户不存在")
		return
	}

	// 验证密码（与 cmd/main.go 保持一致）
	salt, ok := res[0]["salt"].(string)
	if !ok {
		salt = "_bt_all_in_ssl"
	}

	// 第一次 MD5: password + 固定盐
	passwd := req.Password + "_bt_all_in_ssl"
	keyMd5 := md5.Sum([]byte(passwd))
	passwdMd5 := hex.EncodeToString(keyMd5[:])
	// 第二次 MD5: 第一次结果 + 数据库 salt
	passwdMd5 += salt
	keyMd5 = md5.Sum([]byte(passwdMd5))
	passwdMd5 = hex.EncodeToString(keyMd5[:])

	if res[0]["password"] != passwdMd5 {
		public.FailMsg(c, "密码错误")
		return
	}

	// 获取用户 ID
	var userID int64
	if id, ok := res[0]["id"].(int64); ok {
		userID = id
	}

	// 生成 JWT token
	token, err := public.GenerateToken(req.Username, userID, public.JWTExpire)
	if err != nil {
		public.FailMsg(c, "生成 token 失败："+err.Error())
		return
	}

	public.SuccessData(c, gin.H{
		"token":      token,
		"expire":     public.JWTExpire,
		"token_type": "Bearer",
		"username":   req.Username,
	}, 0)
}

// RefreshToken 刷新 JWT Token
// POST /v1/token/refresh
// Body: {"token": "xxx"}
// 或 Header: Authorization: Bearer <token>
func RefreshToken(c *gin.Context) {
	var req struct {
		Token string `json:"token"`
	}

	// 优先从请求体获取 token
	if err := c.ShouldBindJSON(&req); err != nil || req.Token == "" {
		// 从 Authorization header 获取
		authHeader := c.GetHeader("Authorization")
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			req.Token = strings.TrimSpace(parts[1])
		}
	}

	if req.Token == "" {
		public.FailMsg(c, "缺少 token 参数")
		return
	}

	// 刷新 token
	newToken, err := public.RefreshToken(req.Token)
	if err != nil {
		public.FailMsg(c, "刷新 token 失败："+err.Error())
		return
	}

	public.SuccessData(c, gin.H{
		"token":      newToken,
		"expire":     public.JWTExpire,
		"token_type": "Bearer",
	}, 0)
}

// GetAPIKey 获取当前 API Key 配置
// POST /v1/token/get_api_key
func GetAPIKey(c *gin.Context) {
	apiKey := public.GetSettingIgnoreError("api_key")
	if apiKey == "" {
		public.SuccessData(c, gin.H{
			"api_key": "",
			"enabled": false,
		}, 0)
		return
	}

	public.SuccessData(c, gin.H{
		"api_key": apiKey,
		"enabled": true,
	}, 0)
}

// GenerateAPIToken 生成一次性 API Token（用于测试）
// POST /v1/token/generate_api_token
// Body: {"timestamp": 1234567890}
func GenerateAPITokenHandler(c *gin.Context) {
	var req struct {
		Timestamp string `json:"timestamp"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.Timestamp == "" {
		// 如果未提供时间戳，使用当前时间
		req.Timestamp = strconv.FormatInt(time.Now().Unix(), 10)
	}

	apiKey := public.GetSettingIgnoreError("api_key")
	if apiKey == "" {
		public.FailMsg(c, "未配置 API Key，请先在设置中生成")
		return
	}

	apiToken := public.GenerateAPIToken(apiKey, req.Timestamp)

	public.SuccessData(c, gin.H{
		"api_key":     apiKey,
		"timestamp":   req.Timestamp,
		"api_token":   apiToken,
		"bearer":      "api_key:" + apiKey + ":" + req.Timestamp + ":" + apiToken,
		"expire_in":   300, // 5 分钟
		"usage":       "Authorization: Bearer " + "api_key:" + apiKey + ":" + req.Timestamp + ":" + apiToken,
	}, 0)
}

// SaveAPIKey 保存 API Key
// POST /v1/token/save_api_key
// Body: {"api_key": "your-api-key"}
func SaveAPIKey(c *gin.Context) {
	var req struct {
		APIKey string `json:"api_key" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		public.FailMsg(c, "参数错误："+err.Error())
		return
	}

	req.APIKey = strings.TrimSpace(req.APIKey)
	if len(req.APIKey) < 6 {
		public.FailMsg(c, "API Key 长度至少为 6 位")
		return
	}

	// 保存到数据库（使用 upsert 逻辑）
	s, err := public.NewSqlite("data/settings.db", "")
	if err != nil {
		public.FailMsg(c, "数据库错误："+err.Error())
		return
	}
	defer s.Close()

	s.TableName = "settings"
	now := time.Now().Format("2006-01-02 15:04:05")
	
	// 检查是否存在
	existing, _ := s.Where("key=?", []interface{}{"api_key"}).Select()
	if len(existing) == 0 {
		// 插入新记录
		_, err = s.Insert(map[string]interface{}{
			"key":         "api_key",
			"value":       req.APIKey,
			"type":        "1",
			"active":      1,
			"create_time": now,
			"update_time": now,
		})
	} else {
		// 更新现有记录
		_, err = s.Where("key=?", []interface{}{"api_key"}).Update(map[string]interface{}{
			"value":       req.APIKey,
			"update_time": now,
		})
	}

	if err != nil {
		public.FailMsg(c, "保存失败："+err.Error())
		return
	}

	public.SuccessMsg(c, "API Key 保存成功")
}

// DeleteAPIKey 删除 API Key
// POST /v1/token/delete_api_key
func DeleteAPIKey(c *gin.Context) {
	err := public.UpdateSetting("api_key", "")
	if err != nil {
		public.FailMsg(c, "删除失败："+err.Error())
		return
	}

	public.SuccessMsg(c, "API Key 已删除")
}
