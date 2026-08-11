package deploy

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/public"
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"github.com/jlaffaye/ftp"
	"path"
	"strconv"
	"strings"
	"time"
)

type FTPConfig struct {
	Host               string
	Port               any
	User               string
	Password           string
	Mode               string `json:"mode"`                 // pasv 默认 / port
	TLS                string `json:"tls"`                  // 空=不加密 / explicit=显式TLS(AUTH TLS) / implicit=隐式TLS
	InsecureSkipVerify bool   `json:"insecure_skip_verify"` // 跳过证书校验（自签证书）
	MTLS               bool   `json:"mtls"`                 // 双向认证开关
	ClientCert         string `json:"client_cert"`          // mTLS 客户端证书 PEM（可选）
	ClientKey          string `json:"client_key"`           // mTLS 客户端私钥 PEM（可选）
}

// dialFTP 连接并登录 FTP 服务器
func dialFTP(config FTPConfig) (*ftp.ServerConn, error) {
	var port string
	switch v := config.Port.(type) {
	case float64:
		port = strconv.Itoa(int(v))
	case string:
		port = v
	case int:
		port = strconv.Itoa(v)
	default:
		port = "21"
	}
	addr := fmt.Sprintf("%s:%s", config.Host, port)

	var opts []ftp.DialOption
	opts = append(opts, ftp.DialWithTimeout(15*time.Second))
	// 仅支持被动模式（PASV/EPSV）：jlaffaye/ftp 库无主动 PORT 实现，
	// 历史配置中的 port 值忽略并回退为被动
	if config.Mode != "pasv" {
		config.Mode = "pasv"
	}
	if config.TLS != "" {
		tlsConfig := &tls.Config{
			InsecureSkipVerify: config.InsecureSkipVerify,
			ServerName:         config.Host,
			MinVersion:         tls.VersionTLS12,
		}
		if config.MTLS {
			if config.ClientCert == "" || config.ClientKey == "" {
				return nil, fmt.Errorf("mTLS已开启，客户端证书和私钥不能为空")
			}
			cert, err := tls.X509KeyPair([]byte(config.ClientCert), []byte(config.ClientKey))
			if err != nil {
				return nil, fmt.Errorf("解析客户端证书失败: %v", err)
			}
			tlsConfig.Certificates = []tls.Certificate{cert}
		}
		switch config.TLS {
		case "implicit":
			opts = append(opts, ftp.DialWithTLS(tlsConfig))
		case "explicit":
			opts = append(opts, ftp.DialWithExplicitTLS(tlsConfig))
		}
	}
	conn, err := ftp.Dial(addr, opts...)
	if err != nil {
		return nil, fmt.Errorf("FTP连接失败: %v", err)
	}
	if err := conn.Login(config.User, config.Password); err != nil {
		conn.Quit()
		return nil, fmt.Errorf("FTP登录失败: %v", err)
	}
	return conn, nil
}

// resolveRemotePath 智能识别上传路径：
// 以 / 结尾或无扩展名视为目录，自动拼接默认文件名；否则视为完整文件路径直接使用
func resolveRemotePath(raw, defaultName string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return raw
	}
	if strings.HasSuffix(raw, "/") {
		return raw + defaultName
	}
	if path.Ext(path.Base(raw)) == "" {
		return raw + "/" + defaultName
	}
	return raw
}

// ftpEnsureDir 递归创建远程目录（已存在则跳过），完成后回到根目录
func ftpEnsureDir(conn *ftp.ServerConn, remoteDir string) error {
	dir := strings.Trim(remoteDir, "/")
	if dir == "" {
		return nil
	}
	cur := ""
	for _, seg := range strings.Split(dir, "/") {
		cur += "/" + seg
		if err := conn.ChangeDir(cur); err != nil {
			if err := conn.MakeDir(cur); err != nil {
				return fmt.Errorf("创建远程目录失败 %s: %v", cur, err)
			}
		}
	}
	if err := conn.ChangeDir("/"); err != nil {
		return fmt.Errorf("切换目录失败: %v", err)
	}
	return nil
}

// ftpUpload 上传文件到远程路径（自动创建多级目录）
func ftpUpload(conn *ftp.ServerConn, remotePath string, content []byte) error {
	if err := ftpEnsureDir(conn, path.Dir(remotePath)); err != nil {
		return err
	}
	if err := conn.Stor(remotePath, bytes.NewReader(content)); err != nil {
		return fmt.Errorf("上传文件失败 %s: %v", remotePath, err)
	}
	return nil
}

// DeployFTP 通过 FTP 部署证书（证书 + 私钥）
func DeployFTP(cfg map[string]any, logger *public.Logger) error {
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
	}
	var providerID string
	switch v := cfg["provider_id"].(type) {
	case float64:
		providerID = strconv.Itoa(int(v))
	case string:
		providerID = v
	default:
		return fmt.Errorf("参数错误：provider_id")
	}
	keyPath, ok := cfg["keyPath"].(string)
	if !ok {
		return fmt.Errorf("参数错误：keyPath")
	}
	certPath, ok := cfg["certPath"].(string)
	if !ok {
		return fmt.Errorf("参数错误：certPath")
	}
	if strings.TrimSpace(certPath) == "" {
		return fmt.Errorf("参数错误：证书文件路径不能为空")
	}
	if strings.TrimSpace(keyPath) == "" {
		return fmt.Errorf("参数错误：私钥文件路径不能为空")
	}

	certPath = resolveRemotePath(certPath, "fullchain.pem")
	keyPath = resolveRemotePath(keyPath, "privkey.pem")

	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return err
	}
	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return fmt.Errorf("api配置错误")
	}
	var providerConfig FTPConfig
	if err := json.Unmarshal([]byte(providerConfigStr), &providerConfig); err != nil {
		return err
	}
	conn, err := dialFTP(providerConfig)
	if err != nil {
		return err
	}
	defer conn.Quit()

	files := []struct {
		path    string
		content string
	}{
		{certPath, certPem},
		{keyPath, keyPem},
	}
	for _, f := range files {
		if err := ftpUpload(conn, f.path, []byte(f.content)); err != nil {
			return fmt.Errorf("FTP 部署失败: %v", err)
		}
		logger.Info("FTP 上传文件成功: ", f.path)
	}
	return nil
}

// FTPAPITest 测试 FTP 连通性
func FTPAPITest(providerID string) error {
	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return err
	}
	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return fmt.Errorf("api配置错误")
	}
	var providerConfig FTPConfig
	if err := json.Unmarshal([]byte(providerConfigStr), &providerConfig); err != nil {
		return err
	}
	conn, err := dialFTP(providerConfig)
	if err != nil {
		return err
	}
	defer conn.Quit()

	// 验证目录可访问
	if _, err := conn.CurrentDir(); err != nil {
		return fmt.Errorf("FTP目录访问失败: %v", err)
	}
	return nil
}
