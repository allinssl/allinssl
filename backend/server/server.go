package server

import (
	"ALLinSSL/backend/middleware"
	"ALLinSSL/backend/public"
	"ALLinSSL/backend/route"
	"context"
	"crypto/tls"
	"encoding/gob"
	"fmt"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/memstore"
	"github.com/gin-gonic/gin"
	"github.com/tjfoc/gmsm/gmtls"
	"net/http"
	"os"
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
				// 读取 SM2 证书和密钥（PEM 格式）
				certPem, err := os.ReadFile("data/https/cert.pem")
				midCertPem, err := os.ReadFile("data/https/mid_cert.pem")

				keyPem, err := os.ReadFile("data/https/key.pem")
				midKeyPem, err := os.ReadFile("data/https/mid_key.pem")

				tlsCert, err := gmtls.X509KeyPair(certPem, keyPem)
				midcert, err := gmtls.X509KeyPair(midCertPem, midKeyPem)
				if err != nil {
					errchan <- fmt.Errorf("无法加载国密证书和私钥: %v", err)
					return
				}

				tlsConfig := &gmtls.Config{
					Certificates: []gmtls.Certificate{tlsCert, midcert}, // 使用国密证书和加密证书
					MinVersion:   gmtls.VersionGMSSL,
					MaxVersion:   gmtls.VersionGMSSL,
					GMSupport: &gmtls.GMSupport{
						WorkMode: gmtls.ModeGMSSLOnly,
					}, // 启用 GM/T 0024 协议
					CipherSuites: []uint16{
						gmtls.GMTLS_SM2_WITH_SM4_SM3, // 明确指定国密套件
					},
					GetConfigForClient: func(chi *gmtls.ClientHelloInfo) (*gmtls.Config, error) {
						fmt.Printf("客户端 Hello 协议版本: %x, 支持 cipher suites: %+v\n", chi.SupportedVersions, chi.CipherSuites)
						return nil, nil
					},
				}
				//srv.TLSConfig = tlsConfig
				ln, err := gmtls.Listen("tcp", ":"+public.Port, tlsConfig)
				if err != nil {
					errchan <- fmt.Errorf("无法启动国密 HTTPS 服务器: %v", err)
					return
				}
				err = http.Serve(ln, r)
				if err != nil {
					errchan <- err
				}
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
