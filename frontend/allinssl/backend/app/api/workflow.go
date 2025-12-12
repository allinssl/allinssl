package api

import (
	"ALLinSSL/backend/internal/workflow"
	"ALLinSSL/backend/public"
	"github.com/gin-gonic/gin"
	"strings"
)

func GetWorkflowList(c *gin.Context) {
	var form struct {
		Search string `form:"search"`
		Page   int64  `form:"p"`
		Limit  int64  `form:"limit"`
	}
	err := c.Bind(&form)
	if err != nil {
		// c.JSON(http.StatusBadRequest, public.ResERR(err.Error()))
		public.FailMsg(c, err.Error())
		return
	}

	data, count, err := workflow.GetList(form.Search, form.Page, form.Limit)
	if err != nil {
		// c.JSON(http.StatusBadRequest, public.ResERR(err.Error()))
		public.FailMsg(c, err.Error())
		return
	}
	// c.JSON(http.StatusOK, public.ResOK(len(data), data, ""))
	public.SuccessData(c, data, count)
	return
}

func AddWorkflow(c *gin.Context) {
	var form struct {
		Name     string `form:"name"`
		Content  string `form:"content"`
		ExecType string `form:"exec_type"`
		Active   string `form:"active"`
		ExecTime string `form:"exec_time"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.Name = strings.TrimSpace(form.Name)
	form.ExecType = strings.TrimSpace(form.ExecType)

	err = workflow.AddWorkflow(form.Name, form.Content, form.ExecType, form.Active, form.ExecTime)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "添加成功")
	return
}

func DelWorkflow(c *gin.Context) {
	var form struct {
		ID string `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)

	err = workflow.DelWorkflow(form.ID)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "删除成功")
	return

}

func UpdWorkflow(c *gin.Context) {
	var form struct {
		ID       string `form:"id"`
		Name     string `form:"name"`
		Content  string `form:"content"`
		ExecType string `form:"exec_type"`
		Active   string `form:"active"`
		ExecTime string `form:"exec_time"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)
	form.Name = strings.TrimSpace(form.Name)
	form.ExecType = strings.TrimSpace(form.ExecType)

	err = workflow.UpdWorkflow(form.ID, form.Name, form.Content, form.ExecType, form.Active, form.ExecTime)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "修改成功")
	return
}

func UpdExecType(c *gin.Context) {
	var form struct {
		ID       string `form:"id"`
		ExecType string `form:"exec_type"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)
	form.ExecType = strings.TrimSpace(form.ExecType)

	err = workflow.UpdExecType(form.ID, form.ExecType)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "修改成功")
	return
}

func UpdActive(c *gin.Context) {
	var form struct {
		ID     string `form:"id"`
		Active string `form:"active"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}

	form.ID = strings.TrimSpace(form.ID)
	form.Active = strings.TrimSpace(form.Active)
	if form.ID == "" {
		public.FailMsg(c, "ID不能为空")
		return
	}

	err = workflow.UpdActive(form.ID, form.Active)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "修改成功")
	return
}

func ExecuteWorkflow(c *gin.Context) {
	var form struct {
		ID string `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)

	err = workflow.ExecuteWorkflow(form.ID)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "执行成功")
	return
}

func StopWorkflow(c *gin.Context) {
	var form struct {
		ID string `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)

	err = workflow.StopWorkflow(form.ID)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "停止成功")
	return
}

func GetWorkflowHistory(c *gin.Context) {
	var form struct {
		ID    string `form:"id"`
		Page  int64  `form:"p"`
		Limit int64  `form:"limit"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)

	data, count, err := workflow.GetListWH(form.ID, form.Page, form.Limit)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, count)
	return
}

func GetExecLog(c *gin.Context) {
	var form struct {
		ID string `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)

	data, err := workflow.GetExecLog(form.ID)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, 0)
	return
}
