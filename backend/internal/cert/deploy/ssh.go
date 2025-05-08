package deploy

import (
	"ALLinSSL/backend/internal/access"
	"bytes"
	"encoding/json"
	"fmt"
	"golang.org/x/crypto/ssh"
	"strconv"
)

type SSHConfig struct {
	User       string
	Password   string // 可选
	PrivateKey string // 可选
	Host       string
	Port       float64
}

type RemoteFile struct {
	Path    string
	Content string
}

func buildAuthMethods(password, privateKey string) ([]ssh.AuthMethod, error) {
	var methods []ssh.AuthMethod
	
	if privateKey != "" {
		signer, err := ssh.ParsePrivateKey([]byte(privateKey))
		if err != nil {
			return nil, fmt.Errorf("unable to parse private key: %v", err)
		}
		methods = append(methods, ssh.PublicKeys(signer))
	}
	
	if password != "" {
		methods = append(methods, ssh.Password(password))
	}
	
	if len(methods) == 0 {
		return nil, fmt.Errorf("no authentication methods provided")
	}
	
	return methods, nil
}

func writeMultipleFilesViaSSH(config SSHConfig, files []RemoteFile, preCmd, postCmd string) error {
	addr := fmt.Sprintf("%s:%d", config.Host, int(config.Port))
	
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
	
	var script bytes.Buffer
	
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
	
	if err := session.Run(cmd); err != nil {
		return fmt.Errorf("运行出错: %v", err)
	}
	
	return nil
}

func DeploySSH(cfg map[string]any) error {
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
		return fmt.Errorf("参数错误：beforeCmd")
	}
	afterCmd, ok := cfg["afterCmd"].(string)
	if !ok {
		return fmt.Errorf("参数错误：afterCmd")
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
	err = writeMultipleFilesViaSSH(providerConfig, files, beforeCmd, afterCmd)
	if err != nil {
		return fmt.Errorf("SSH 部署失败: %v", err)
	}
	return nil
}
