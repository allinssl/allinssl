package setting

import (
	"ALLinSSL/backend/public"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/joho/godotenv"
	"io"
	"net/http"
	"os"
	"strconv"
	"syscall"
	"time"
)

type Setting struct {
	Timeout  int    `json:"timeout" form:"timeout"`
	Secure   string `json:"secure" form:"secure"`
	Https    string `json:"https" form:"https"`
	Key      string `json:"key" form:"key"`
	Cert     string `json:"cert" form:"cert"`
	Username string `json:"username" form:"username"`
	Password string `json:"password" form:"password"`
}

func Get() (Setting, error) {
	var setting = Setting{
		Timeout: public.TimeOut,
		Secure:  public.Secure,
	}

	setting.Https = public.GetSettingIgnoreError("https")
	key, err := os.ReadFile("data/https/key.pem")
	if err != nil {
		key = []byte{}
	}
	cert, err := os.ReadFile("data/https/cert.pem")
	if err != nil {
		cert = []byte{}
	}
	setting.Key = string(key)
	setting.Cert = string(cert)
	s, err := public.NewSqlite("data/settings.db", "")
	if err != nil {
		return setting, err
	}
	defer s.Close()
	s.TableName = "users"
	data, err := s.Select()
	if err != nil {
		return setting, err
	}
	if len(data) == 0 {
		return setting, fmt.Errorf("no users found")
	}
	username := data[0]["username"].(string)
	setting.Username = username
	return setting, nil
}

func Save(setting *Setting) error {
	var restart bool
	var reload bool

	s, err := public.NewSqlite("data/settings.db", "")
	if err != nil {
		return err
	}
	defer s.Close()
	if setting.Username != "" || setting.Password != "" {
		s.TableName = "users"
		user, err := s.Where("id=1", []interface{}{}).Select()
		if err != nil {
			return err
		}
		if len(user) == 0 {
			return fmt.Errorf("no users found")
		}
		data := map[string]interface{}{}
		if setting.Username != "" {
			data["username"] = setting.Username
		}

		salt := user[0]["salt"].(string)
		passwd := setting.Password + salt
		// fmt.Println(passwd)
		keyMd5 := md5.Sum([]byte(passwd))
		passwdMd5 := hex.EncodeToString(keyMd5[:])
		if setting.Password != "" {
			data["password"] = passwdMd5
		}
		_, err = s.Where("id=1", []interface{}{}).Update(data)
		if err != nil {
			return err
		}
		reload = true
	}
	s.TableName = "settings"
	if setting.Timeout != 0 && setting.Timeout != public.TimeOut {
		s.Where("key = 'timeout'", []interface{}{}).Update(map[string]interface{}{"value": setting.Timeout})
		public.TimeOut = setting.Timeout
		restart = true
	}
	if setting.Secure != "" && setting.Secure != public.Secure {
		s.Where("key = 'secure'", []interface{}{}).Update(map[string]interface{}{"value": setting.Secure})
		public.TimeOut = setting.Timeout
		restart = true
	}
	if setting.Https != "" && setting.Https != public.GetSettingIgnoreError("https") {
		if setting.Https == "1" {
			if setting.Key == "" || setting.Cert == "" {
				return fmt.Errorf("key or cert is empty")
			}
			// fmt.Println(setting.Key, setting.Cert)
			err := public.ValidateSSLCertificate(setting.Cert, setting.Key)
			if err != nil {
				return err
			}
			// dir := filepath.Dir("data/https")
			if err := os.MkdirAll("data/https", os.ModePerm); err != nil {
				panic("创建目录失败: " + err.Error())
			}
			err = os.WriteFile("data/https/key.pem", []byte(setting.Key), 0644)
			// fmt.Println(err)
			os.WriteFile("data/https/cert.pem", []byte(setting.Cert), 0644)
		}
		s.Where("key = 'https'", []interface{}{}).Update(map[string]interface{}{"value": setting.Https})
		restart = true
	}
	if restart {
		Restart()
		return nil
	} else {
		if reload {
			public.LoginKey = public.GenerateUUID()
		}
	}
	return nil
}

func Shutdown() {
	go func() {
		time.Sleep(time.Millisecond * 100)
		public.ShutdownFunc()
	}()
	return
}

func Restart() {
	go func() {
		time.Sleep(time.Millisecond * 100)
		env, err := godotenv.Read("data/.env")
		if err != nil {
			env = map[string]string{
				"web":       "restart",
				"scheduler": "start",
			}
		}
		pidStr, err := os.ReadFile("data/pid")
		if err != nil {
			fmt.Println("Error reading pid file")
			return
		}
		err = godotenv.Write(env, "data/.env")
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
	}()
	return
}

func GetVersion() (map[string]string, error) {
	version := "v1.0.6"
	update := "0"
	newVersionObj, err := http.Get("https://download.allinssl.com/version.json")
	if err != nil {
		return map[string]string{
			"version":     version,
			"new_version": version,
			"update":      update,
			"log":         "",
			"date":        "",
		}, nil
	}
	defer newVersionObj.Body.Close()

	var newVersionData map[string]string
	body, _ := io.ReadAll(newVersionObj.Body)
	err = json.Unmarshal(body, &newVersionData)
	if err != nil {
		return nil, fmt.Errorf("failed to parse version data: %v", err)
	}
	if version != newVersionData["version"] {
		update = "1"
	}
	newVersionData["new_version"] = newVersionData["version"]
	newVersionData["version"] = version
	newVersionData["update"] = update
	return newVersionData, nil
}
