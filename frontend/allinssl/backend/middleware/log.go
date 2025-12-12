package middleware

import (
	"ALLinSSL/backend/public"
	"fmt"
	"time"
	
	"github.com/gin-gonic/gin"
)

func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		
		duration := time.Since(start)
		method := c.Request.Method
		path := c.Request.URL.Path
		status := c.Writer.Status()
		clientIP := c.ClientIP()
		userAgent := c.Request.UserAgent()
		respSize := c.Writer.Size() // 响应体字节大小
		
		msg := fmt.Sprintf(
			"| %3d | %13v | %15s | %-7s %-30s | UA: %-40s | RespSize: %d bytes",
			status,
			duration,
			clientIP,
			method,
			path,
			userAgent,
			respSize,
		)
		
		public.Info(msg)
	}
}
