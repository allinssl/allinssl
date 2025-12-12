package server

import (
	"ALLinSSL/backend/middleware"
	"ALLinSSL/backend/public"
	"ALLinSSL/backend/route"
	"context"
	"crypto/tls"
	"encoding/gob"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/memstore"
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
)

func Run() error {
	public.ReloadConfig()
	public.InitLogger(public.LogPath)
	defer public.CloseLogger()
	r := gin.Default()

	store := memstore.NewStore([]byte("secret")) // 只在内存中，不持久化
	r.Use(sessions.Sessions(public.SessionKey, store))
	r.Use(middleware.LoggerMiddleware())
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	gob.Register(time.Time{})
	r.Use(middleware.SessionAuthMiddleware())
	// r.Use(middleware.OpLoggerMiddleware())
	route.Register(r)
	ctx, cancel := context.WithCancel(context.Background())
	public.ShutdownFunc = cancel
	err := RunServer(ctx, r)
	if err != nil {
		return err
	}
	return nil
}

func RunServer(ctx context.Context, r *gin.Engine) error {

	// 初始化http服务
	srv := &http.Server{
		Addr:    ":" + public.Port,
		Handler: r,
	}
	errchan := make(chan error, 1)
	if public.GetSettingIgnoreError("https") == "1" {
		srv.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12, // 推荐设置最低 TLS 版本
		}
		go func() {
			defer close(errchan)
			err := srv.ListenAndServeTLS("data/https/cert.pem", "data/https/key.pem")
			if err != nil {
				errchan <- err
			}
		}()
	} else {
		go func() {
			defer close(errchan)
			err := srv.ListenAndServe()
			if err != nil {
				errchan <- err
			}
		}()
	}
	select {
	case err := <-errchan:
		return err
	case <-ctx.Done():
		_ = srv.Shutdown(ctx)
	}
	return nil
}
