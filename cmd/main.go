package main

import (
	_ "ALLinSSL/backend/migrations"
	"ALLinSSL/backend/public"
	"ALLinSSL/backend/scheduler"
	"ALLinSSL/backend/server"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"github.com/joho/godotenv"
	ps "github.com/mitchellh/go-ps"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"strconv"
	"syscall"
	"time"
)

var s = &scheduler.Scheduler{}
var pidPath = "data/pid"
var envPath = "data/.env"

var envVars = map[string]string{
	"web":       "start",
	"scheduler": "start",
}

func main() {
	if len(os.Args) < 2 {
		//fmt.Println(`请不要直接运行本程序`)
		// start()
		if runtime.GOOS == "windows" {
			go func() {
				time.Sleep(1 * time.Second)
				http := "http"
				if public.GetSettingIgnoreError("https") == "1" {
					http = "https"
				}
				secure := "/login"
				if public.Secure != "" {
					secure = public.Secure
				}
				url := fmt.Sprintf("%s://127.0.0.1:%s%s", http, public.Port, secure)
				err := exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
				if err != nil {
					fmt.Println("无法打开浏览器，请手动访问：", url)
				} else {
					fmt.Println("正在打开浏览器，请稍候...", url)
				}
			}()
			mainRun()
		}
		return
	}
	env, err := godotenv.Read(envPath)
	if err == nil {
		envVars = env
	}

	cmd := os.Args[1]
	switch cmd {
	case "start":
		mainRun()
	case "help":
		fmt.Println(`
ALLinSSL 管理命令:
start - 启动 ALLinSSL
1 - 后台运行 ALLinSSL（仅支持linux）
2 - 停止 ALLinSSL
3 - 重启 ALLinSSL
4 - 设置安全入口
5 - 设置用户名
6 - 设置密码
7 - 设置端口号
8 - 停止 web 服务
9 - 启动 web 服务
10 - 重启 web 服务
11 - 停止后台调度服务
12 - 启动后台调度服务
13 - 重启后台调度服务
14 - 关闭 HTTPS
15 - 查看面板地址和用户信息
`)
	case "1":
		fmt.Println("Starting ALLinSSL...")
		if checkRun() {
			_ = exec.Command("/bin/bash", "-c", fmt.Sprintf("nohup %s start > /dev/null 2>&1 &", os.Args[0])).Run()
			fmt.Println("Started ALLinSSL")
			return
		}
		fmt.Println("ALLinSSL is already running")
	case "2":
		fmt.Println("Stopping ALLinSSL...")
		pid, err := os.ReadFile(pidPath)
		if err != nil {
			fmt.Println("Error reading pid file")
			return
		}
		exec.Command("kill", "-9", string(pid)).Run()
		os.Remove(pidPath)
		fmt.Println("Stopped ALLinSSL")
	case "3":
		fmt.Println("Restarting ALLinSSL...")
		pid, err := os.ReadFile(pidPath)
		if err != nil {
			fmt.Println("Error reading pid file")
		}
		exec.Command("kill", "-9", string(pid)).Run()
		os.Remove(pidPath)
		exec.Command("/bin/bash", "-c", fmt.Sprintf("nohup %s start > /dev/null 2>&1 &", os.Args[0])).Run()
		fmt.Println("Restarted ALLinSSL")
	case "4":
		var secure string
		if len(os.Args) > 2 {
			secure = os.Args[2]
		} else {
			fmt.Print("请输入安全入口: ")
			fmt.Scanln(&secure)
		}
		if len(secure) < 5 {
			fmt.Println("安全入口至少需要5位")
			return
		}
		if secure[0] != '/' {
			secure = "/" + secure
		}
		if secure == "/login" {
			fmt.Println("安全入口不能是/login")
			return
		}
		err := public.UpdateSetting("secure", secure)
		if err != nil {
			fmt.Println("Error updating setting:", err)
			return
		}
		envVars["web"] = "restart"
		err = control()
		fmt.Println("安全入口设置成功:", secure)
	case "5":
		var input string
		if len(os.Args) > 2 {
			input = os.Args[2]
		} else {
			fmt.Print("请输入用户名: ")
			fmt.Scanln(&input)
		}
		if len(input) < 5 {
			fmt.Println("用户名至少需要5位")
			return
		}
		s, err := public.NewSqlite("data/settings.db", "")
		if err != nil {
			fmt.Println(err)
			return
		}
		defer s.Close()
		s.TableName = "users"
		_, err = s.Where("id=1", []interface{}{}).Update(map[string]interface{}{"username": input})
		if err != nil {
			fmt.Println(err)
			return
		}
		envVars["web"] = "restart"
		err = control()
		fmt.Println("用户名设置成功:", input)
	case "6":
		var input string
		if len(os.Args) > 2 {
			input = os.Args[2]
		} else {
			fmt.Print("请输入密码: ")
			fmt.Scanln(&input)
		}
		if len(input) < 8 {
			fmt.Println("密码至少需要8位")
			return
		}
		s, err := public.NewSqlite("data/settings.db", "")
		if err != nil {
			fmt.Println(err)
			return
		}
		defer s.Close()
		s.TableName = "users"
		user, err := s.Where("id=1", []interface{}{}).Select()
		if err != nil {
			fmt.Println("Error selecting user:", err)
			return
		}
		if len(user) == 0 {
			fmt.Println("No user")
			return
		}
		salt := user[0]["salt"].(string)
		passwd := input + "_bt_all_in_ssl"
		keyMd5 := md5.Sum([]byte(passwd))
		passwdMd5 := hex.EncodeToString(keyMd5[:])
		passwdMd5 += salt
		keyMd5 = md5.Sum([]byte(passwdMd5))
		passwdMd5 = hex.EncodeToString(keyMd5[:])

		_, err = s.Where("id=1", []interface{}{}).Update(map[string]interface{}{"password": passwdMd5})
		if err != nil {
			fmt.Println(err)
			return
		}
		envVars["web"] = "restart"
		err = control()
		fmt.Println("密码设置成功:", input)
	case "7":
		var input string
		if len(os.Args) > 2 {
			input = os.Args[2]
		} else {
			fmt.Print("请输入端口号: ")
			fmt.Scanln(&input)
		}
		port, err := strconv.Atoi(input) // 转换成整数
		if err != nil {
			fmt.Println("端口号必须是数字！")
			return
		}
		if port < 1 || port > 65535 {
			fmt.Println("端口号必须在 1 到 65535 之间！")
			return
		}
		err = public.UpdateSetting("port", input)
		if err != nil {
			fmt.Println("Error updating setting:", err)
			return
		}
		fmt.Println("端口号设置成功:", input)
		envVars["web"] = "restart"
		control()
	case "8":
		envVars["web"] = "stop"
		if control() != nil {
			return
		}
		fmt.Println("web服务已停止")
	case "9":
		envVars["web"] = "start"
		if control() != nil {
			return
		}
		fmt.Println("web服务已启动")
	case "10":
		envVars["web"] = "restart"
		if control() != nil {
			return
		}
		fmt.Println("已重启web服务")
	case "11":
		envVars["scheduler"] = "stop"
		if control() != nil {
			return
		}
		fmt.Println("后台调度服务已停止")
	case "12":
		envVars["scheduler"] = "start"
		if control() != nil {
			return
		}
		fmt.Println("后台调度服务已开启")

	case "13":
		envVars["scheduler"] = "restart"
		if control() != nil {
			return
		}
		fmt.Println("已重启后台调度服务")

	case "14":
		err := public.UpdateSetting("https", "0")
		if err != nil {
			fmt.Println("Error updating setting:", err)
			return
		}
		envVars["web"] = "restart"
		control()
	case "15":
		public.ReloadConfig()
		http := "http"
		if public.GetSettingIgnoreError("https") == "1" {
			http = "https"
		}

		localIp, err := public.GetLocalIP()
		if err != nil {
			localIp = "0.0.0.0"
		}
		localAddr := fmt.Sprintf("%s://%s:%s%s", http, localIp, public.Port, public.Secure)
		publicIp, err := public.GetPublicIP()
		if err != nil {
			publicIp = "0.0.0.0"
		}
		publicAddr := fmt.Sprintf("%s://%s:%s%s", http, publicIp, public.Port, public.Secure)

		s, err := public.NewSqlite("data/settings.db", "")
		if err != nil {
			fmt.Println(err)
			return
		}
		defer s.Close()
		s.TableName = "users"
		user, err := s.Where("id=1", []interface{}{}).Select()
		if err != nil {
			fmt.Println("Error selecting user:", err)
			return
		}
		if len(user) == 0 {
			fmt.Println("No user")
			return
		}
		username, ok := user[0]["username"].(string)
		if !ok {
			fmt.Println("Error getting username")
			return
		}

		fmt.Printf(`
 外网面板地址:      %s
 内网面板地址:      %s
 用户名:      %s
 密码:       ********
`,
			publicAddr, localAddr, username)
	default:
		fmt.Println("无效的命令")
	}
}

func control() (err error) {
	pidStr, err := os.ReadFile(pidPath)
	if err != nil {
		fmt.Println("Error reading pid file")
		return
	}
	err = godotenv.Write(envVars, envPath)
	if err != nil {
		fmt.Println("Error writing to .env file")
		return
	}
	pid, err := strconv.Atoi(string(pidStr))
	if err != nil {
		fmt.Println("Error converting pid to int:", err)
		return
	}
	process, err := os.FindProcess(pid)
	if err != nil {
		fmt.Println("Error finding process:", err)
		return
	}
	err = process.Signal(syscall.SIGHUP)
	if err != nil {
		fmt.Println("Error sending signal:", err)
		return
	}
	return
}

func mainRun() {
	if checkRun() {
		pid := os.Getpid()
		os.WriteFile(pidPath, []byte(fmt.Sprintf("%d", pid)), 0644)
		defer os.Remove(pidPath)
		go func() {
			fmt.Println("web服务正在运行...")
			err := server.Run()
			if err != nil {
				fmt.Println("web服务在运行时遇到错误:", err)
			}
			fmt.Println("web服务已停止")
		}()
		fmt.Println("正在启动调度器...")
		go s.Start()
		fmt.Println("调度器启动成功")

		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGHUP)
		for {
			<-c
			run()
		}
	} else {
		fmt.Println("服务已经启动")
	}
}

func checkRun() bool {
	_, err := os.Stat(pidPath)
	if err != nil {
		return true
	}
	pid, err := os.ReadFile(pidPath)
	if err != nil {
		os.Remove(pidPath)
		return true
	}
	pidInt, err := strconv.Atoi(string(pid))
	if err != nil {
		fmt.Println("Error converting pid to int")
		os.Remove(pidPath)
		return true
	}
	switch runtime.GOOS {
	case "windows":
		return isProcessAliveWindows(pidInt)
	default:
		return isProcessAliveUnix(pidInt)
	}
}

// Unix/Linux/macOS 检测
func isProcessAliveUnix(pid int) bool {
	proc, err := os.FindProcess(pid)
	if err != nil {
		return true
	}
	// 发送 0 信号，不会杀死，只是检测
	err = proc.Signal(syscall.Signal(0))
	return err != nil
}

// Windows 检测（遍历进程表）
func isProcessAliveWindows(pid int) bool {
	processList, err := ps.Processes()
	if err != nil {
		return true
	}
	for _, p := range processList {
		if p.Pid() == pid {
			return false
		}
	}
	return true
}

func run() {
	envVars, err := godotenv.Read(envPath)
	if err != nil {
		fmt.Println("Error reading .env file")
	}
	switch envVars["web"] {
	case "start":
		go func() {
			fmt.Println("web服务正在运行...")
			err := server.Run()
			if err != nil {
				fmt.Println("web服务在运行时遇到错误:", err)
				return
				// errchan <- err
			}
			fmt.Println("web服务已停止")
		}()
	case "stop":
		public.ShutdownFunc()
		fmt.Println("web服务已停止")
	case "restart":
		public.ShutdownFunc()
		go func() {
			fmt.Println("web服务正在运行...")
			err := server.Run()
			if err != nil {
				fmt.Println("web服务在运行时遇到错误:", err)
				return
			}
			fmt.Println("web服务已停止")
		}()
	}
	switch envVars["scheduler"] {
	case "start":
		go s.Start()
	case "stop":
		s.Stop()
	case "restart":
		s.Restart()
	}
}
