package middleware

import (
	"ALLinSSL/backend/public"
	"encoding/gob"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"net/http"
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
		session := sessions.Default(c)
		now := time.Now()
		gob.Register(time.Time{})
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
			// c.Abort()
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
							if session.Get("__login_key") != public.GetSettingIgnoreError("login_key") {
								// session.Set("secure", true)
								session.Set("login", nil)
								session.Save()
								// c.JSON(http.StatusUnauthorized, gin.H{"message": "登录信息发生变化，请重新登录"})
								c.Redirect(http.StatusFound, "/login")
								// c.Abort()
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
