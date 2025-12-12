package api

import (
	"ALLinSSL/backend/app/dto/response"
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/internal/cert/deploy"
	"ALLinSSL/backend/internal/cert/deploy/plugin"
	"ALLinSSL/backend/public"
	"strings"

	"github.com/gin-gonic/gin"
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

func GetAllEAB(c *gin.Context) {
	var form struct {
		CA string `form:"ca"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	eabList, err := access.GetAllEAB(form.CA)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, eabList, 0)
	return
}

func GetEABList(c *gin.Context) {
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
	eabList, count, err := access.GetEABList(form.Search, form.Page, form.Limit)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, eabList, count)
	return
}

func AddEAB(c *gin.Context) {
	var form struct {
		Name        string `form:"name"`
		Kid         string `form:"Kid"`
		HmacEncoded string `form:"HmacEncoded"`
		CA          string `form:"ca"`
		Mail        string `form:"mail"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.Name = strings.TrimSpace(form.Name)
	form.Kid = strings.TrimSpace(form.Kid)
	form.HmacEncoded = strings.TrimSpace(form.HmacEncoded)
	form.CA = strings.TrimSpace(form.CA)
	form.Mail = strings.TrimSpace(form.Mail)
	if form.Name == "" {
		public.FailMsg(c, "名称不能为空")
		return
	}
	if form.Kid == "" {
		public.FailMsg(c, "ID不能为空")
		return
	}
	if form.HmacEncoded == "" {
		public.FailMsg(c, "HmacEncoded不能为空")
		return
	}
	if form.CA == "" {
		public.FailMsg(c, "CA不能为空")
		return
	}
	if form.Mail == "" {
		public.FailMsg(c, "Email不能为空")
		return
	}
	err = access.AddEAB(form.Name, form.Kid, form.HmacEncoded, form.CA, form.Mail)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "添加成功")
	return
}

func UpdEAB(c *gin.Context) {
	var form struct {
		ID          string `form:"id"`
		Name        string `form:"name"`
		Kid         string `form:"Kid"`
		HmacEncoded string `form:"HmacEncoded"`
		CA          string `form:"ca"`
		Mail        string `form:"mail"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.Name = strings.TrimSpace(form.Name)
	form.Kid = strings.TrimSpace(form.Kid)
	form.HmacEncoded = strings.TrimSpace(form.HmacEncoded)
	form.CA = strings.TrimSpace(form.CA)
	form.Mail = strings.TrimSpace(form.Mail)
	if form.Name == "" {
		public.FailMsg(c, "名称不能为空")
		return
	}
	if form.Kid == "" {
		public.FailMsg(c, "ID不能为空")
		return
	}
	if form.HmacEncoded == "" {
		public.FailMsg(c, "HmacEncoded不能为空")
		return
	}
	if form.CA == "" {
		public.FailMsg(c, "CA不能为空")
		return
	}
	if form.Mail == "" {
		public.FailMsg(c, "mail不能为空")
		return
	}
	err = access.UpdEAB(form.ID, form.Name, form.Kid, form.HmacEncoded, form.CA, form.Mail)
	if err != nil {
		public.FailMsg(c, err.Error())
	}
	public.SuccessMsg(c, "修改成功")
	return
}

func DelEAB(c *gin.Context) {
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
	err = access.DelEAB(form.ID)
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
	case "rainyun":
		result = deploy.RainyunApiTest(form.ID)
	case "qiniu":
		result = deploy.QiniuAPITest(form.ID)
	case "baidu":
		result = deploy.BaiduyunAPITest(form.ID)
	default:
		public.FailMsg(c, "不支持测试的提供商")
		return
	}

	if result != nil {
		public.FailMsg(c, result.Error())
		return
	}

	public.SuccessMsg(c, "请求测试成功！")
	return
}

func GetSiteList(c *gin.Context) {
	var form struct {
		ID     string `form:"id"`
		Type   string `form:"type"`
		Search string `form:"search"`
		Page   int64  `form:"p"`
		Limit  int64  `form:"limit"`
	}
	err := c.ShouldBind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}

	var siteList []response.AccessSiteList
	switch form.Type {
	case "btpanel-site":
		siteList, err = deploy.BtPanelSiteList(form.ID)
	case "1panel-site":
		siteList, err = deploy.OnePanelSiteList(form.ID)
	default:
		public.FailMsg(c, "不支持的提供商")
	}

	if err != nil {
		public.SuccessData(c, siteList, len(siteList))
		return
	}

	public.SuccessData(c, siteList, len(siteList))
}

func GetPluginActions(c *gin.Context) {
	var form struct {
		Name string `form:"name"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	form.Name = strings.TrimSpace(form.Name)
	if form.Name == "" {
		public.FailMsg(c, "插件名称不能为空")
		return
	}
	data, err := plugin.GetActions(form.Name)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, len(data))
	return
}

func GetPlugins(c *gin.Context) {
	data, err := plugin.GetPlugins()
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, len(data))
	return
}
