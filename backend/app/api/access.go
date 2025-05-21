package api

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/internal/cert/deploy"
	"ALLinSSL/backend/public"
	"github.com/gin-gonic/gin"
	"strings"
)

func GetAccessList(c *gin.Context) {
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
	accessList, count, err := access.GetList(form.Search, form.Page, form.Limit)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, accessList, count)
	return

}

func GetAllAccess(c *gin.Context) {
	var form struct {
		Type string `form:"type"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	accessList, err := access.GetAll(form.Type)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, accessList, 0)
	return

}

func AddAccess(c *gin.Context) {
	var form struct {
		Name   string `form:"name"`
		Type   string `form:"type"`
		Config string `form:"config"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.Name = strings.TrimSpace(form.Name)
	if form.Name == "" {
		public.FailMsg(c, "名称不能为空")
		return
	}
	if form.Type == "" {
		public.FailMsg(c, "类型不能为空")
		return
	}
	if form.Config == "" {
		public.FailMsg(c, "配置不能为空")
		return
	}
	err = access.AddAccess(form.Config, form.Name, form.Type)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "添加成功")
	return

}

func UpdateAccess(c *gin.Context) {
	var form struct {
		ID     string `form:"id"`
		Name   string `form:"name"`
		Config string `form:"config"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.Name = strings.TrimSpace(form.Name)
	if form.Name == "" {
		public.FailMsg(c, "名称不能为空")
		return
	}
	if form.Config == "" {
		public.FailMsg(c, "配置不能为空")
		return
	}
	err = access.UpdateAccess(form.ID, form.Config, form.Name)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "修改成功")
	return

}

func DelAccess(c *gin.Context) {
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
	err = access.DelAccess(form.ID)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "删除成功")
	return
}

func TestAccess(c *gin.Context) {
	var form struct {
		ID   string `form:"id"`
		Type string `form:"type"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if form.Type == "" {
		public.FailMsg(c, "类型不能为空")
		return
	}
	
	var result error
	switch form.Type {
	case "btwaf":
		result = deploy.BtWafAPITest(form.ID)
	case "btpanel":
		result = deploy.BtPanelAPITest(form.ID)
	case "ssh":
		result = deploy.SSHAPITest(form.ID)
	case "safeline":
		result = deploy.SafeLineAPITest(form.ID)
	case "1panel":
		result = deploy.OnePanelAPITest(form.ID)
	case "tencentcloud":
		result = deploy.TencentCloudAPITest(form.ID)
	case "aliyun":
		result = deploy.AliyunCdnAPITest(form.ID)
	case "qiniu":
		result = deploy.QiniuAPITest(form.ID)
	default:
		public.FailMsg(c, "不支持测试的提供商")
	}
	
	if result != nil {
		public.FailMsg(c, result.Error())
		return
	}
	
	public.SuccessMsg(c, "请求测试成功！")
	return
}
