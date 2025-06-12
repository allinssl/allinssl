package apply

import (
	"ALLinSSL/backend/public"
	"crypto"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"github.com/go-acme/lego/v4/registration"
	"time"
)

type MyUser struct {
	Email        string
	Registration *registration.Resource
	key          crypto.PrivateKey
}

func (u *MyUser) GetEmail() string {
	return u.Email
}

func (u *MyUser) GetRegistration() *registration.Resource {
	return u.Registration
}

func (u *MyUser) GetPrivateKey() crypto.PrivateKey {
	return u.key
}

func SaveUserToDB(db *public.Sqlite, user *MyUser, Type string) error {
	keyBytes, err := x509.MarshalPKCS8PrivateKey(user.key)
	if err != nil {
		return err
	}
	regBytes := []byte("")
	if user.Registration != nil {
		regBytes, err = json.Marshal(user.Registration)
		if err != nil {
			return err
		}
	}

	pemBytes := pem.EncodeToMemory(&pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: keyBytes,
	})
	now := time.Now().Format("2006-01-02 15:04:05")
	data, err := db.Where(`email=? and type=?`, []interface{}{user.Email, Type}).Select()
	if err != nil {
		return err
	}
	if len(data) > 0 {
		_, err = db.Update(map[string]interface{}{
			"private_key": string(pemBytes),
			"reg":         regBytes,
			"update_time": now,
		})
	} else {
		_, err = db.Insert(map[string]interface{}{
			"email":       user.Email,
			"private_key": string(pemBytes),
			"reg":         regBytes,
			"create_time": now,
			"update_time": now,
			"type":        Type,
		})
	}
	return err
}

func GetAcmeUser(email string, logger *public.Logger, accData map[string]any) (user *MyUser) {
	privateKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	user = &MyUser{
		Email: email,
		key:   privateKey,
	}

	if accData == nil {
		return
	}
	reg, ok := accData["reg"].(string)
	if !ok || reg == "" {
		logger.Debug("acme账号未注册，注册新账号")
		return
	}
	key, ok := accData["private_key"].(string)
	if !ok || key == "" {
		logger.Debug("acme账号私钥不存在，注册新账号")
		return
	}

	var Registration registration.Resource
	localKey, err1 := public.ParsePrivateKey([]byte(key))
	if err1 != nil {
		logger.Debug("acme账号私钥解析失败", err1)
		return
	}
	err2 := json.Unmarshal([]byte(reg), &Registration)
	if err2 != nil {
		return
	}
	logger.Debug("acme账号私钥和注册信息解析成功")
	user.key = localKey
	user.Registration = &Registration

	return
}

func GetAccount(db *public.Sqlite, email, ca string) (map[string]interface{}, error) {
	data, err := db.Where(`email=? and type=?`, []interface{}{email, ca}).Select()
	if err != nil {
		return nil, err
	}
	if len(data) == 0 {
		return nil, fmt.Errorf("user not found")
	}
	return data[0], nil
}

func AddAccount(email, ca, Kid, HmacEncoded, CADirURL string) error {
	db, err := GetSqlite()
	if err != nil {
		return fmt.Errorf("failed to get sqlite: %w", err)
	}
	now := time.Now().Format("2006-01-02 15:04:05")
	account := map[string]interface{}{
		"email":       email,
		"type":        ca,
		"Kid":         Kid,
		"HmacEncoded": HmacEncoded,
		"CADirURL":    CADirURL,
		"create_time": now,
		"update_time": now,
	}
	_, err = db.Insert(account)
	if err != nil {
		return fmt.Errorf("failed to insert account: %w", err)
	}
	return nil
}

func UpdateAccount(id, email, ca, Kid, HmacEncoded, CADirURL string) error {
	db, err := GetSqlite()
	if err != nil {
		return fmt.Errorf("failed to get sqlite: %w", err)
	}
	account := map[string]interface{}{
		"email":       email,
		"type":        ca,
		"Kid":         Kid,
		"HmacEncoded": HmacEncoded,
		"CADirURL":    CADirURL,
		"update_time": time.Now().Format("2006-01-02 15:04:05"),
	}
	_, err = db.Where("id=?", []any{id}).Update(account)
	if err != nil {
		return fmt.Errorf("failed to update account: %w", err)
	}
	return nil
}

func DeleteAccount(id string) error {
	db, err := GetSqlite()
	if err != nil {
		return fmt.Errorf("failed to get sqlite: %w", err)
	}
	_, err = db.Where("id=?", []any{id}).Delete()
	if err != nil {
		return fmt.Errorf("failed to delete account: %w", err)
	}
	return nil
}

func GetAccountList(search, ca string, p, limit int64) ([]map[string]interface{}, error) {
	db, err := GetSqlite()
	if err != nil {
		return nil, fmt.Errorf("failed to get sqlite: %w", err)
	}
	whereSql := "1=1"
	var whereArgs []any
	limits := []int64{0, 100}
	if p >= 0 && limit >= 0 {
		limits = []int64{0, limit}
		if p > 1 {
			limits[0] = (p - 1) * limit
			limits[1] = limit
		}
	}
	if search != "" {
		whereSql += " and (email like ? or type like ?)"
		whereArgs = append(whereArgs, "%"+search+"%", "%"+search+"%")
	}
	if ca != "" {
		if ca == "custom" {
			whereSql += `and type not in ('Let's Encrypt','buypass', 'google', 'sslcom', 'zerossl')`
		} else {
			whereSql += " and type=?"
			whereArgs = append(whereArgs, ca)
		}
	}
	return db.Where(whereSql, whereArgs).Limit(limits).Select()
}
