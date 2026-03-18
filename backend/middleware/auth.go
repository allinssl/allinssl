package middleware

import (
	"ALLinSSL/backend/public"
	"encoding/gob"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"strings"
	"time"
)

var Html404 = []byte(`<html>
<head><title>404 Not Found</title></head>
<body bgcolor="white">
<center><h1>404 Not Found</h1></center>
<hr><center>AllinSSL</center>
</body>
</html>`)

func SessionAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		routePath := c.Request.URL.Path
		method := c.Request.Method
		paths := strings.Split(strings.TrimPrefix(routePath, "/"), "/")

		// 跳过认证检查的路径：登录和 token 相关接口
		if len(paths) >= 2 {
			if paths[0] == "v1" && (paths[1] == "login" || paths[1] == "token") {
				c.Next()
				return
			}
		}

		// 按优先级检查多种认证方式：
		// 1. Bearer Token (Authorization header)
		// 2. JWT Token (Authorization: Bearer <token>)
		// 3. API Token (api_token form parameter)
		// 4. Session Cookie

		if checkBearerToken(c) {
			return
		}

		if checkApiKey(c) {
			return
		}

		session := sessions.Default(c)
		now := time.Now()
		gob.Register(time.Time{})
		if public.Secure == "/" || public.Secure == "/login" {
			// 如果安全入口是根目录或登录页，则不需要特殊处理
			public.Secure = ""
		}
		if public.Secure == "" && session.Get("secure") == nil {
			// 如果安全入口是根目录或登录页，则不需要特殊处理
			session.Set("secure", true)
			session.Set("lastRequestTime", now)
			session.Save()
		}
		last := session.Get("lastRequestTime")

		if routePath == public.Secure {
			if session.Get("secure") == nil {
				// 访问安全入口，设置 session
				session.Set("secure", true)
				session.Set("lastRequestTime", now)
				// 一定要保存 session BEFORE redirect
				session.Save()
			}
			// 返回登录页
			c.Redirect(http.StatusFound, "/login")
			c.Abort()
			return
		} else {
			if session.Get("secure") == nil || last == nil {
				c.Data(404, "text/html; charset=utf-8", Html404)
				c.Abort()
				return
			} else {
				if lastTime, ok := last.(time.Time); ok {
					if now.Sub(lastTime) >= time.Second*time.Duration(public.TimeOut) {
						if session.Get("login") == nil {
							session.Clear()
							session.Save()
							c.Data(404, "text/html; charset=utf-8", Html404)
							c.Abort()
							return
						} else {
							session.Delete("login")
							session.Set("lastRequestTime", now)
							session.Save()
							c.Redirect(http.StatusFound, "/login")
							return
						}
					} else {
						if session.Get("login") == nil {
							if len(paths) > 0 {
								if paths[0] == "login" {
									c.Next()
									return
								}
							}
							if len(paths) > 1 {
								if paths[1] == "login" {
									c.Next()
									return
								}
							}
							if routePath == "/favicon.ico" {
								return
							}
							// 判断是否为静态文件路径
							if method == "GET" {
								if len(paths) > 1 && paths[0] == "static" {
									c.Next()
									return
								}
							}
							// 返回登录页
							c.Redirect(http.StatusFound, "/login")
							c.Abort()
							return
						} else {
							if session.Get("__login_key") != public.LoginKey {
								// session.Set("secure", true)
								session.Set("login", nil)
								session.Save()
								// c.JSON(http.StatusUnauthorized, gin.H{"message": "登录信息发生变化，请重新登录"})
								c.Redirect(http.StatusFound, "/login")
								c.Abort()
							} else {
								// 访问正常，更新最后请求时间
								session.Set("lastRequestTime", now)
								session.Save()
								if paths[0] == "login" {
									c.Redirect(http.StatusFound, "/")
									c.Abort()
									return
								}
							}
						}
					}
				} else {
					c.Data(404, "text/html; charset=utf-8", Html404)
					c.Abort()
					return
				}
			}
		}
	}
}

// checkBearerToken 检查 Bearer Token (支持 JWT 和 API Key)
// 支持两种格式：
// 1. Authorization: Bearer <jwt_token>
// 2. Authorization: Bearer api_key:<api_key>:<timestamp>:<api_token>
func checkBearerToken(c *gin.Context) bool {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return false
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return false
	}

	token := strings.TrimSpace(parts[1])

	// 尝试解析为 JWT token
	claims, err := public.ParseToken(token)
	if err == nil && claims != nil {
		// JWT token 有效，将用户信息存入 context
		c.Set("username", claims.Username)
		c.Set("user_id", claims.UserID)
		c.Set("auth_type", "jwt")
		c.Next()
		c.Abort()
		return true
	}

	// 尝试解析为 API Key 格式：api_key:<api_key>:<timestamp>:<api_token>
	if strings.HasPrefix(token, "api_key:") {
		parts := strings.SplitN(token, ":", 4)
		if len(parts) == 4 {
			apiKey := parts[1]
			timestamp := parts[2]
			apiToken := parts[3]

			if public.VerifyAPIKey(apiKey, apiToken, timestamp) {
				c.Set("auth_type", "api_key")
				c.Set("username", "api_user")
				c.Next()
				c.Abort()
				return true
			}
		}
	}

	return false
}

func checkApiKey(c *gin.Context) bool {
	var form struct {
		ApiToken  string `form:"api_token"`
		Timestamp string `form:"timestamp"`
	}
	err := c.Bind(&form)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		c.Abort()
		return false
	}
	if form.ApiToken == "" || form.Timestamp == "" {
		return false
	}
	apiKey := public.GetSettingIgnoreError("api_key")
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未开启api"})
		c.Abort()
		return false
	}
	// timestamp := time.Now().Unix()
	ApiToken := public.GenerateAPIToken(apiKey, form.Timestamp)
	if form.ApiToken != ApiToken {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		c.Abort()
		return false
	}
	// 这里可以添加其他的验证逻辑，比如检查时间戳是否过期等
	timestamp, err := strconv.ParseInt(form.Timestamp, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid timestamp"})
		return false
	}
	if time.Now().Unix()-timestamp > 60*5 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "timestamp expired"})
		return false
	}
	return true
}
