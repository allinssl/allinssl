package api

import (
	"ALLinSSL/backend/internal/cert/apply"
	"ALLinSSL/backend/public"
	"github.com/gin-gonic/gin"
	"strings"
)

func AddAccount(c *gin.Context) {
	var form struct {
		Email       string `form:"email"`
		CA          string `form:"ca"`
		Kid         string `form:"Kid"`
		HmacEncoded string `form:"HmacEncoded"`
		CADirURL    string `form:"CADirURL"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.Email = strings.TrimSpace(form.Email)
	if form.Email == "" {
		public.FailMsg(c, "邮件不能为空")
		return
	}
	if form.CA == "" {
		public.FailMsg(c, "CA不能为空")
		return
	}
	err = apply.AddAccount(form.Email, form.CA, form.Kid, form.HmacEncoded, form.CADirURL)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "添加成功")
	return
}

func DelAccount(c *gin.Context) {
	var form struct {
		ID string `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)
	if form.ID == "" {
		public.FailMsg(c, "ID不能为空")
		return
	}

	err = apply.DelAccount(form.ID)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "删除成功")
	return
}

func UpdateAccount(c *gin.Context) {
	var form struct {
		ID          string `form:"id"`
		Email       string `form:"email"`
		CA          string `form:"ca"`
		Kid         string `form:"Kid"`
		HmacEncoded string `form:"HmacEncoded"`
		CADirURL    string `form:"CADirURL"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)
	if form.ID == "" {
		public.FailMsg(c, "ID不能为空")
		return
	}
	form.Email = strings.TrimSpace(form.Email)
	if form.Email == "" {
		public.FailMsg(c, "邮件不能为空")
		return
	}
	if form.CA == "" {
		public.FailMsg(c, "CA不能为空")
		return
	}

	err = apply.UpdateAccount(form.ID, form.Email, form.CA, form.Kid, form.HmacEncoded, form.CADirURL)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "更新成功")
	return
}

func GetAccountList(c *gin.Context) {
	var form struct {
		Page   int64  `form:"p"`
		Limit  int64  `form:"limit"`
		CA     string `form:"ca"`
		Search string `form:"search"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if form.Page <= 0 {
		form.Page = 1
	}
	if form.Limit <= 0 {
		form.Limit = 10
	}
	accounts, total, err := apply.GetAccountList(form.Search, form.CA, form.Page, form.Limit)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, accounts, total)
}

func GetCaList(c *gin.Context) {
	cas, total, err := apply.GetCaList()
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, cas, total)

}
