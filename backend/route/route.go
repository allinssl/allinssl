package route

import (
	"ALLinSSL/backend/app/api"
	"github.com/gin-gonic/gin"
	"net/http"
)

func Register(r *gin.Engine) {
	v1 := r.Group("/v1")

	login := v1.Group("/login")
	{
		login.POST("/sign", api.Sign)
		login.POST("/sign-out", api.SignOut)
		login.GET("/get_code", api.GetCode)
	}
	siteMonitor := v1.Group("/siteMonitor")
	{
		siteMonitor.POST("/get_list", api.GetMonitorList)
		siteMonitor.POST("/add_site_monitor", api.AddMonitor)
		siteMonitor.POST("/upd_site_monitor", api.UpdMonitor)
		siteMonitor.POST("/del_site_monitor", api.DelMonitor)
		siteMonitor.POST("/set_site_monitor", api.SetMonitor)
	}
	workflow := v1.Group("/workflow")
	{
		workflow.POST("/get_list", api.GetWorkflowList)
		workflow.POST("/add_workflow", api.AddWorkflow)
		workflow.POST("/del_workflow", api.DelWorkflow)
		workflow.POST("/upd_workflow", api.UpdWorkflow)
		workflow.POST("/exec_type", api.UpdExecType)
		workflow.POST("/active", api.UpdActive)
		workflow.POST("/execute_workflow", api.ExecuteWorkflow)
		workflow.POST("/get_workflow_history", api.GetWorkflowHistory)
		workflow.POST("/get_exec_log", api.GetExecLog)
		workflow.POST("/stop", api.StopWorkflow)
	}
	access := v1.Group("/access")
	{
		access.POST("/get_list", api.GetAccessList)
		access.POST("/add_access", api.AddAccess)
		access.POST("/del_access", api.DelAccess)
		access.POST("/upd_access", api.UpdateAccess)
		access.POST("/get_all", api.GetAllAccess)
		access.POST("/test_access", api.TestAccess)
		access.POST("/get_sites", api.GetSiteList)

		access.POST("/get_eab_list", api.GetEABList)
		access.POST("/add_eab", api.AddEAB)
		access.POST("/del_eab", api.DelEAB)
		access.POST("/upd_eab", api.UpdEAB)
		access.POST("/get_all_eab", api.GetAllEAB)

		// 插件先放这里
		access.POST("/get_plugin_actions", api.GetPluginActions)
		access.POST("/get_plugins", api.GetPlugins)
	}
	// acme账户
	acmeAccount := v1.Group("/acme_account")
	{
		acmeAccount.POST("/get_list", api.GetAccountList)
		acmeAccount.POST("/get_ca_list", api.GetCaList)
		acmeAccount.POST("/add_account", api.AddAccount)
		acmeAccount.POST("/del_account", api.DelAccount)
		acmeAccount.POST("/upd_account", api.UpdateAccount)
	}
	cert := v1.Group("/cert")
	{
		cert.POST("/get_list", api.GetCertList)
		cert.POST("/upload_cert", api.UploadCert)
		cert.POST("/del_cert", api.DelCert)
		cert.GET("/download", api.DownloadCert)
	}
	report := v1.Group("/report")
	{
		report.POST("/get_list", api.GetReportList)
		report.POST("/add_report", api.AddReport)
		report.POST("/del_report", api.DelReport)
		report.POST("/upd_report", api.UpdReport)
		report.POST("/notify_test", api.NotifyTest)
	}
	setting := v1.Group("/setting")
	{
		setting.POST("/get_setting", api.GetSetting)
		setting.POST("/save_setting", api.SaveSetting)
		setting.POST("/shutdown", api.Shutdown)
		setting.POST("/restart", api.Restart)
		setting.POST("/get_version", api.GetVersion)
	}
	overview := v1.Group("/overview")
	{
		overview.POST("/get_overviews", api.GetOverview)
	}

	// 1. 提供静态文件服务
	r.StaticFS("/static", http.Dir("./frontend/static"))             // 静态资源路径
	r.StaticFS("/auto-deploy/static", http.Dir("./frontend/static")) // 静态资源路径
	// 返回 favicon.ico
	r.GET("/favicon.ico", func(c *gin.Context) {
		c.File("./frontend/favicon.ico")
	})

	// 3. 前端路由托管：匹配所有其他路由并返回 index.html
	r.NoRoute(func(c *gin.Context) {
		c.File("./frontend/index.html")
	})
	// v2 := r.Group("/v2")
	// {
	// 	v2.POST("/submit")
	// }
}
