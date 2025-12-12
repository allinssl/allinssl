package api

import (
	"ALLinSSL/backend/internal/report"
	"ALLinSSL/backend/public"
	"github.com/gin-gonic/gin"
)

func GetReportList(c *gin.Context) {
	var form struct {
		Search string `form:"search"`
		Page   int64  `form:"p"`
		Limit  int64  `form:"limit"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	certList, count, err := report.GetList(form.Search, form.Page, form.Limit)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, certList, count)
	return
}

func AddReport(c *gin.Context) {
	var form struct {
		Name   string `form:"name"`
		Type   string `form:"type"`
		Config string `form:"config"`
	}
	err := c.Bind(&form)
	if err != nil {
		// fmt.Println(err)
		public.FailMsg(c, err.Error())
		return
	}
	err = report.AddReport(form.Type, form.Config, form.Name)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "添加成功")
	return
}

func UpdReport(c *gin.Context) {
	var form struct {
		Id     string `form:"id"`
		Name   string `form:"name"`
		Config string `form:"config"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	err = report.UpdReport(form.Id, form.Config, form.Name)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "修改成功")
	return
}

func DelReport(c *gin.Context) {
	var form struct {
		Id string `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	err = report.DelReport(form.Id)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "删除成功")
}

func NotifyTest(c *gin.Context) {
	var form struct {
		Id string `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	err = report.NotifyTest(form.Id)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "发送成功")
}
