package deploy

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/public"
	"bytes"
	"encoding/json"
	"fmt"
	"golang.org/x/crypto/ssh"
	"os"
	"path/filepath"
	"strconv"
)

type SSHConfig struct {
	User       string
	Password   string // 可选
	PrivateKey string `json:"key"` // 可选
	Host       string
	Port       any
	Mode       string `json:"mode"`
}

type RemoteFile struct {
	Path    string
	Content string
}

func buildAuthMethods(password, privateKey string) ([]ssh.AuthMethod, error) {
	var methods []ssh.AuthMethod

	if privateKey != "" {
		var signer ssh.Signer
		var err error
		if password != "" {
			signer, err = ssh.ParsePrivateKeyWithPassphrase([]byte(privateKey), []byte(password))
			if err != nil {
				return nil, fmt.Errorf("无法解析带密码的私钥: %v", err)
			}
		} else {
			signer, err = ssh.ParsePrivateKey([]byte(privateKey))
			if err != nil {
				return nil, fmt.Errorf("无法解析私钥: %v", err)
			}
		}
		methods = append(methods, ssh.PublicKeys(signer))
	}

	if password != "" && privateKey == "" {
		methods = append(methods, ssh.Password(password))
	}

	if len(methods) == 0 {
		return nil, fmt.Errorf("未提供有效的认证方式")
	}

	return methods, nil
}

func writeMultipleFilesViaSSH(config SSHConfig, files []RemoteFile, preCmd, postCmd string, logger *public.Logger) error {
	var port string
	switch v := config.Port.(type) {
	case float64:
		port = strconv.Itoa(int(v))
	case string:
		port = v
	case int:
		port = strconv.Itoa(v)
	default:
		port = "22"
	}
	IPtype := public.CheckIPType(config.Host)
	if IPtype == "IPv6" {
		config.Host = "[" + config.Host + "]"
	}
	addr := fmt.Sprintf("%s:%s", config.Host, port)
	if config.Mode == "" || config.Mode == "password" {
		config.PrivateKey = ""
	}

	authMethods, err := buildAuthMethods(config.Password, config.PrivateKey)
	if err != nil {
		return err
	}

	sshConfig := &ssh.ClientConfig{
		User:            config.User,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return fmt.Errorf("failed to dial: %v", err)
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("会话创建失败: %v", err)
	}
	defer session.Close()
	var script, stdoutBuf, stderrBuf bytes.Buffer
	session.Stdout = &stdoutBuf
	session.Stderr = &stderrBuf

	if preCmd != "" {
		script.WriteString(preCmd + " && ")
	}

	for i, file := range files {
		if i > 0 {
			script.WriteString(" && ")
		}

		dirCmd := fmt.Sprintf("mkdir -p $(dirname %q)", file.Path)
		writeCmd := fmt.Sprintf("printf %%s '%s' > %s", file.Content, file.Path)

		script.WriteString(dirCmd + " && " + writeCmd)
	}

	if postCmd != "" {
		script.WriteString(" && " + postCmd)
	}

	cmd := script.String()

	err = session.Run(cmd)
	logger.Debug("[STDOUT]", stdoutBuf.String())
	logger.Debug("[STDERR]", stderrBuf.String())

	return err
}

func DeploySSH(cfg map[string]any, logger *public.Logger) error {
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	// 设置证书
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
	beforeCmd, ok := cfg["beforeCmd"].(string)
	if !ok {
		beforeCmd = ""
	}
	afterCmd, ok := cfg["afterCmd"].(string)
	if !ok {
		afterCmd = ""
	}
	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return err
	}
	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return fmt.Errorf("api配置错误")
	}
	// 解析 JSON 配置
	var providerConfig SSHConfig
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return err
	}
	// 自动创建多级目录
	files := []RemoteFile{
		{Path: certPath, Content: certPem},
		{Path: keyPath, Content: keyPem},
	}
	err = writeMultipleFilesViaSSH(providerConfig, files, beforeCmd, afterCmd, logger)
	if err != nil {
		return fmt.Errorf("SSH 部署失败: %v", err)
	}
	return nil
}

func DeployLocalhost(cfg map[string]any) error {
	cert, ok := cfg["certificate"].(map[string]any)
	if !ok {
		return fmt.Errorf("证书不存在")
	}
	// 设置证书
	keyPem, ok := cert["key"].(string)
	if !ok {
		return fmt.Errorf("证书错误：key")
	}
	certPem, ok := cert["cert"].(string)
	if !ok {
		return fmt.Errorf("证书错误：cert")
	}
	keyPath, ok := cfg["keyPath"].(string)
	if !ok {
		return fmt.Errorf("参数错误：keyPath")
	}
	certPath, ok := cfg["certPath"].(string)
	if !ok {
		return fmt.Errorf("参数错误：certPath")
	}
	beforeCmd, ok := cfg["beforeCmd"].(string)
	if ok {
		_, errout, err := public.ExecCommand(beforeCmd)
		if err != nil {
			return fmt.Errorf("前置命令执行失败: %v, %s", err, errout)
		}
	}

	dir := filepath.Dir(certPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		panic("创建证书保存目录失败: " + err.Error())
	}
	dir = filepath.Dir(keyPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		panic("创建私钥保存目录失败: " + err.Error())
	}
	err := os.WriteFile(certPath, []byte(certPem), 0644)
	if err != nil {
		return fmt.Errorf("写入证书失败: %v", err)
	}
	err = os.WriteFile(keyPath, []byte(keyPem), 0644)
	if err != nil {
		return fmt.Errorf("写入私钥失败: %v", err)
	}

	afterCmd, ok := cfg["afterCmd"].(string)
	if ok {
		_, errout, err := public.ExecCommand(afterCmd)
		if err != nil {
			return fmt.Errorf("后置命令执行失败: %v, %s", err, errout)
		}
	}
	return nil
}

func SSHAPITest(providerID string) error {
	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return err
	}

	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return fmt.Errorf("api配置错误")
	}

	// 解析 JSON 配置
	var providerConfig SSHConfig
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return err
	}

	var port string
	switch v := providerConfig.Port.(type) {
	case float64:
		port = strconv.Itoa(int(v))
	case string:
		port = v
	case int:
		port = strconv.Itoa(v)
	default:
		port = "22"
	}
	IPtype := public.CheckIPType(providerConfig.Host)
	if IPtype == "IPv6" {
		providerConfig.Host = "[" + providerConfig.Host + "]"
	}
	addr := fmt.Sprintf("%s:%s", providerConfig.Host, port)
	if providerConfig.Mode == "" || providerConfig.Mode == "password" {
		providerConfig.PrivateKey = ""
	}

	authMethods, err := buildAuthMethods(providerConfig.Password, providerConfig.PrivateKey)
	if err != nil {
		return err
	}

	sshConfig := &ssh.ClientConfig{
		User:            providerConfig.User,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return fmt.Errorf("SSH连接失败: %v", err)
	}
	defer client.Close()

	// 尝试创建会话来验证连接
	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("SSH会话创建失败: %v", err)
	}
	defer session.Close()

	return nil
}
