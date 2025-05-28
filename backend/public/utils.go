package public

import (
	"bytes"
	"crypto/rand"
	"fmt"
	"github.com/google/uuid"
	"io"
	"math/big"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"strings"
)

const defaultCharset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// GetSettingIgnoreError 获取系统配置-忽略错误
func GetSettingIgnoreError(key string) string {
	s, err := NewSqlite("data/settings.db", "")
	if err != nil {
		return ""
	}
	defer s.Close()
	s.TableName = "settings"
	res, err := s.Where("key=?", []interface{}{key}).Select()
	if err != nil {
		return ""
	}
	if len(res) == 0 {
		return ""
	}
	setting, ok := res[0]["value"].(string)
	if !ok {
		return ""
	}
	return setting
}

func UpdateSetting(key, val string) error {
	s, err := NewSqlite("data/settings.db", "")
	if err != nil {
		return err
	}
	defer s.Close()
	s.TableName = "settings"
	_, err = s.Where("key=?", []interface{}{key}).Update(map[string]any{"value": val})
	if err != nil {
		return err
	}
	return nil
}

func GetSettingsFromType(typ string) ([]map[string]any, error) {
	db := "data/settings.db"
	s, err := NewSqlite(db, "")
	if err != nil {
		return nil, err
	}
	defer s.Close()
	s.TableName = "settings"
	res, err := s.Where("type=?", []interface{}{typ}).Select()
	if err != nil {
		return nil, err
	}

	return res, nil
}

// GetFreePort 获取一个可用的随机端口
func GetFreePort() (int, error) {
	// 端口为 0，表示让系统自动分配一个可用端口
	ln, err := net.Listen("tcp", "localhost:0")
	if err != nil {
		return 0, err
	}
	defer ln.Close()

	addr := ln.Addr().String()
	// 提取端口号
	parts := strings.Split(addr, ":")
	if len(parts) < 2 {
		return 0, fmt.Errorf("invalid address: %s", addr)
	}

	var port int
	fmt.Sscanf(parts[len(parts)-1], "%d", &port)
	return port, nil
}

// RandomString 生成指定长度的随机字符串
func RandomString(length int) string {
	if str, err := RandomStringWithCharset(length, defaultCharset); err != nil {
		return "allinssl"
	} else {
		return str
	}
}

// RandomStringWithCharset 使用指定字符集生成随机字符串
func RandomStringWithCharset(length int, charset string) (string, error) {
	result := make([]byte, length)
	charsetLen := big.NewInt(int64(len(charset)))

	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, charsetLen)
		if err != nil {
			return "", err
		}
		result[i] = charset[num.Int64()]
	}

	return string(result), nil
}

// GenerateUUID 生成 UUID
func GenerateUUID() string {
	// 生成一个新的 UUID
	uuidStr := strings.ReplaceAll(uuid.New().String(), "-", "")

	// 返回 UUID 的字符串表示
	return uuidStr
}

func GetLocalIP() (string, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return "", err
	}

	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 {
			continue // 接口未启用
		}
		if iface.Flags&net.FlagLoopback != 0 {
			continue // 忽略回环地址
		}

		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			// 只返回 IPv4 内网地址
			if ip != nil && ip.To4() != nil && !ip.IsLoopback() {
				return ip.String(), nil
			}
		}
	}

	return "", fmt.Errorf("没有找到内网 IP")
}

func GetPublicIP() (string, error) {
	resp, err := http.Get("https://www.bt.cn/Api/getIpAddress")
	if err != nil {
		return "", fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP状态错误: %v", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %v", err)
	}

	return string(body), nil
}

func ContainsAllIgnoreBRepeats(a, b []string) bool {
	// 构建 A 的集合
	setA := make(map[string]struct{})
	for _, item := range a {
		setA[item] = struct{}{}
	}

	// 遍历 B 的唯一元素，判断是否在 A 中
	seen := make(map[string]struct{})
	for _, item := range b {
		if _, checked := seen[item]; checked {
			continue
		}
		seen[item] = struct{}{}
		if _, ok := setA[item]; !ok {
			return false
		}
	}
	return true
}

// ExecCommand 执行系统命令，并返回 stdout、stderr 和错误
func ExecCommand(command string) (string, string, error) {
	var cmd *exec.Cmd

	// 根据操作系统选择解释器
	if runtime.GOOS == "windows" {
		cmd = exec.Command("cmd", "/C", command)
	} else {
		cmd = exec.Command("bash", "-c", command)
	}

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	return stdout.String(), stderr.String(), err
}

func CheckIPType(address string) string {
	ip := net.ParseIP(address)
	if ip == nil {
		return "Invalid IP"
	}
	if ip.To4() != nil {
		return "IPv4"
	}
	return "IPv6"
}
