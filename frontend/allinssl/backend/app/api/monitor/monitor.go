package monitor

import (
	"ALLinSSL/backend/internal/monitor"
	"ALLinSSL/backend/public"
	"ALLinSSL/static"
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
)

func GetMonitorList(c *gin.Context) {
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
	data, count, err := monitor.GetList(form.Search, form.Page, form.Limit)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, count)
	return
}

func AddMonitor(c *gin.Context) {
	var form struct {
		Name          string `form:"name"`
		Target        string `form:"target"`
		MonitorType   string `form:"monitor_type"`
		ReportTypes   string `form:"report_types"`
		Cycle         string `form:"cycle"`
		RepeatSendGap string `form:"repeat_send_gap"`
		Active        string `form:"active"`
		AdvanceDay    string `form:"advance_day"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.Name = strings.TrimSpace(form.Name)
	form.Target = strings.TrimSpace(form.Target)

	err = monitor.AddMonitor(form.Name, form.Target, form.MonitorType, form.ReportTypes, form.Cycle, form.RepeatSendGap, form.Active, form.AdvanceDay)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "添加成功")
	return
}

func UpdMonitor(c *gin.Context) {
	var form struct {
		ID            string `form:"id"`
		Target        string `form:"target"`
		Name          string `form:"name"`
		Cycle         string `form:"cycle"`
		ReportTypes   string `form:"report_types"`
		RepeatSendGap string `form:"repeat_send_gap"`
		Active        string `form:"active"`
		AdvanceDay    string `form:"advance_day"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)
	form.Target = strings.TrimSpace(form.Target)
	form.Name = strings.TrimSpace(form.Name)
	form.ReportTypes = strings.TrimSpace(form.ReportTypes)

	err = monitor.UpdMonitor(form.ID, form.Name, form.Target, form.ReportTypes, form.Cycle, form.RepeatSendGap, form.Active, form.AdvanceDay)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "修改成功")
	return
}

func DelMonitor(c *gin.Context) {
	var form struct {
		ID string `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	err = monitor.DelMonitor(form.ID)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "删除成功")
	return
}

func SetMonitor(c *gin.Context) {
	var form struct {
		ID     string `form:"id"`
		Active int    `form:"active"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	err = monitor.SetMonitor(form.ID, form.Active)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "操作成功")
	return
}

func GetMonitorInfo(c *gin.Context) {
	var form struct {
		ID string `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.ID = strings.TrimSpace(form.ID)
	data, err := monitor.GetInfo(form.ID)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, 0)
	return
}

func GetErrRecord(c *gin.Context) {
	var form struct {
		ID    int64 `form:"id"`
		Page  int64 `form:"p"`
		Limit int64 `form:"limit"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	data, count, err := monitor.GetErrRecord(form.ID, form.Page, form.Limit)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, count)
	return
}

func FileAddMonitor(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		public.FailMsg(c, "上传文件失败: "+err.Error())
		return
	}
	if file.Size > 10*1024*1024 { // 限制文件大小为10MB
		public.FailMsg(c, "上传文件过大，最大限制10MB")
		return
	}
	data, err := monitor.ParseMonitorFile(file)
	if err != nil {
		public.FailMsg(c, "文件解析失败: "+err.Error())
		return
	}
	if len(data) == 0 {
		public.FailMsg(c, "文件中没有有效的监控数据")
		return
	}

	err = monitor.MultiAddMonitor(data)
	if err != nil {
		public.FailMsg(c, "文件导入失败: "+err.Error())
		return
	}
	public.SuccessMsg(c, "文件导入成功")
	return
}

func GetTemplate(c *gin.Context) {
	t := c.Query("type")
	if t == "" {
		c.String(http.StatusBadRequest, "参数 type 不能为空")
		return
	}

	fileMap := map[string]string{
		"txt":  "monitor_templates/template.txt",
		"csv":  "monitor_templates/template.csv",
		"json": "monitor_templates/template.json",
		"xlsx": "monitor_templates/template.xlsx",
	}

	filePath, ok := fileMap[strings.ToLower(t)]
	if !ok {
		c.String(http.StatusBadRequest, "不支持的类型")
		return
	}

	data, err := static.MonitorTemplatesFS.ReadFile(filePath)
	if err != nil {
		c.String(http.StatusInternalServerError, "模板文件读取失败")
		return
	}

	// 设置 Content-Type
	contentTypes := map[string]string{
		"txt":  "text/plain",
		"csv":  "text/csv",
		"json": "application/json",
		"xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"xls":  "application/vnd.ms-excel",
	}
	c.Header("Content-Type", contentTypes[t])
	c.Header("Content-Disposition", "attachment; filename=template."+t)
	c.Data(http.StatusOK, contentTypes[t], data)
}
