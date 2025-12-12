package api

import (
	"ALLinSSL/backend/public"
	"crypto/md5"
	"encoding/hex"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"strings"
	"time"
)

func Sign(c *gin.Context) {
	var form struct {
		Username string `form:"username" binding:"required"`
		Password string `form:"password" binding:"required"`
		Code     string `form:"code"`
	}
	err := c.Bind(&form)
	if err != nil {
		// c.JSON(http.StatusBadRequest, public.ResERR(err.Error()))
		public.FailMsg(c, err.Error())
		// return
	}
	form.Username = strings.TrimSpace(form.Username)
	form.Code = strings.TrimSpace(form.Code)

	// 从数据库拿用户
	s, err := public.NewSqlite("data/settings.db", "")
	if err != nil {
		// c.JSON(http.StatusBadRequest, public.ResERR(err.Error()))
		public.FailMsg(c, err.Error())
		return
	}
	defer s.Close()
	s.TableName = "users"
	res, err := s.Where("username=?", []interface{}{form.Username}).Select()
	if err != nil {
		// c.JSON(http.StatusBadRequest, public.ResERR(err.Error()))
		public.FailMsg(c, err.Error())
		return
	}

	session := sessions.Default(c)
	now := time.Now()

	loginErrCount := session.Get("__loginErrCount")
	loginErrEnd := session.Get("__loginErrEnd")
	ErrCount := 0
	ErrEnd := now
	// 获取登录错误次数
	if __loginErrCount, ok := loginErrCount.(int); ok {
		ErrCount = __loginErrCount
	}
	// 获取登录错误时间
	if __loginErrEnd, ok := loginErrEnd.(time.Time); ok {
		ErrEnd = __loginErrEnd
	}

	// fmt.Println(ErrCount, ErrEnd)

	// 判断登录错误次数
	switch {
	case ErrCount >= 5:
		// 登录错误次数超过5次，15分钟内禁止登录
		if now.Sub(ErrEnd) < 15*time.Minute {
			// c.JSON(http.StatusBadRequest, public.ResERR("登录次数过多，请15分钟后再试"))
			public.FailMsg(c, "登录次数过多，请15分钟后再试")
			return
		}
		session.Delete("__loginErrEnd")
	case ErrCount > 0:
		if form.Code == "" {
			// c.JSON(http.StatusBadRequest, public.ResERR("验证码错误1"))
			public.FailMsg(c, "验证码错误1")
			return
		} else {
			// 这里添加验证码的逻辑
			verifyCode := session.Get("_verifyCode")
			if _verifyCode, ok := verifyCode.(string); ok {
				if !strings.EqualFold(form.Code, _verifyCode) {
					// c.JSON(http.StatusBadRequest, public.ResERR("验证码错误2"))
					public.FailMsg(c, "验证码错误2")
					return
				}
			} else {
				// c.JSON(http.StatusBadRequest, public.ResERR("验证码错误3"))
				public.FailMsg(c, "验证码错误3")
				return
			}
		}
	}

	// 判断用户是否存在
	if len(res) == 0 {
		session.Set("__loginErrCount", ErrCount+1)
		session.Set("__loginErrEnd", now)
		_ = session.Save()
		// c.JSON(http.StatusBadRequest, public.ResERR("用户不存在"))
		// 设置cookie
		c.SetCookie("must_code", "1", 0, "/", "", false, false)
		public.FailMsg(c, "用户不存在")
		return
	}
	// 判断密码是否正确
	// qSalt := "_bt_all_in_ssl"
	// password := md5.Sum([]byte(form.Password + qSalt))
	// passwordMd5 := hex.EncodeToString(password[:])
	// fmt.Println(passwordMd5)
	salt, ok := res[0]["salt"].(string)
	if !ok {
		salt = "_bt_all_in_ssl"
	}
	passwd := form.Password + salt
	// fmt.Println(passwd)
	keyMd5 := md5.Sum([]byte(passwd))
	passwdMd5 := hex.EncodeToString(keyMd5[:])
	// fmt.Println(passwdMd5)

	if res[0]["password"] != passwdMd5 {
		session.Set("__loginErrCount", ErrCount+1)
		session.Set("__loginErrEnd", now)
		_ = session.Save()
		// c.JSON(http.StatusBadRequest, public.ResERR("密码错误"))
		// 设置cookie
		c.SetCookie("must_code", "1", 0, "/", "", false, false)
		public.FailMsg(c, "密码错误")
		return
	}

	// session := sessions.Default(c)
	session.Set("__loginErrCount", 0)
	session.Delete("__loginErrEnd")
	session.Set("login", true)
	session.Set("__login_key", public.LoginKey)
	_ = session.Save()
	// c.JSON(http.StatusOK, public.ResOK(0, nil, "登录成功"))
	// 设置cookie
	c.SetCookie("must_code", "1", -1, "/", "", false, false)
	public.SuccessMsg(c, "登录成功")
	return
}

func GetCode(c *gin.Context) {
	_, bs64, code, _ := public.GenerateCode()
	session := sessions.Default(c)

	session.Set("_verifyCode", code)
	_ = session.Save()
	public.SuccessData(c, bs64, 0)
	return
}

func SignOut(c *gin.Context) {
	session := sessions.Default(c)
	session.Delete("login")
	_ = session.Save()
	// c.JSON(http.StatusOK, public.ResOK(0, nil, "登出成功"))
	public.SuccessMsg(c, "登出成功")
	return
}
