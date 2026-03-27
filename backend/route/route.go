package route

import (
	"ALLinSSL/backend/app/api"
	"ALLinSSL/backend/app/api/monitor"
	"ALLinSSL/backend/app/api/private_ca"
	"ALLinSSL/backend/public"
	"ALLinSSL/static"
	"github.com/gin-gonic/gin"
	"io/fs"
	"net/http"
	"strings"
)

func Register(r *gin.Engine) {
	v1 := r.Group("/v1")

	login := v1.Group("/login")
	{
		login.POST("/sign", api.Sign)
		login.POST("/sign-out", api.SignOut)
		login.GET("/get_code", api.GetCode)
	}

	// Token 管理
	token := v1.Group("/token")
	{
		token.POST("/generate", api.GenerateToken)
		token.POST("/refresh", api.RefreshToken)
		token.POST("/get_api_key", api.GetAPIKey)
		token.POST("/generate_api_token", api.GenerateAPITokenHandler)
		token.POST("/save_api_key", api.SaveAPIKey)
		token.POST("/delete_api_key", api.DeleteAPIKey)
	}

	_monitor := v1.Group("/monitor")
	{
		_monitor.POST("/get_list", monitor.GetMonitorList)
		_monitor.POST("/add_monitor", monitor.AddMonitor)
		_monitor.POST("/upd_monitor", monitor.UpdMonitor)
		_monitor.POST("/del_monitor", monitor.DelMonitor)
		_monitor.POST("/set_monitor", monitor.SetMonitor)
		_monitor.POST("/get_monitor_info", monitor.GetMonitorInfo)
		_monitor.POST("/get_err_record", monitor.GetErrRecord)
		_monitor.POST("/file_add_monitor", monitor.FileAddMonitor)
		_monitor.GET("/template", monitor.GetTemplate)
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
		workflow.POST("/del_workflow_history", api.DelWorkflowHistory)
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
		access.POST("/get_plugin_raw_metadata", api.GetPluginRawMetadata)
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
		setting.GET("/download_data", api.DownloadData)
		setting.POST("/upload_data", api.UploadData)
	}
	overview := v1.Group("/overview")
	{
		overview.POST("/get_overviews", api.GetOverview)
	}
	privateCa := v1.Group("/private_ca")
	{
		privateCa.POST("/create_root_ca", private_ca.CreateRootCA)
		privateCa.POST("/create_intermediate_ca", private_ca.CreateIntermediateCA)
		privateCa.POST("/get_ca_list", private_ca.GetCAList)
		privateCa.POST("/del_ca", private_ca.DeleteCA)

		privateCa.POST("/create_leaf_cert", private_ca.CreateLeafCert)
		privateCa.POST("/get_leaf_cert_list", private_ca.GetLeafCertList)
		privateCa.POST("/del_leaf_cert", private_ca.DeleteLeafCert)
		privateCa.GET("/download_cert", private_ca.DownloadCert)
	}

	// 静态资源：/static -> build/static
	staticFS, _ := fs.Sub(static.BuildFS, "build/static")
	r.StaticFS("/static", http.FS(staticFS))
	r.StaticFS("/auto-deploy/static", http.FS(staticFS))
	r.StaticFS("/monitor/static", http.FS(staticFS))

	// favicon.ico
	r.GET("/favicon.ico", func(c *gin.Context) {
		data, err := static.BuildFS.ReadFile("build/favicon.ico")
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		c.Data(http.StatusOK, "image/x-icon", data)
	})

	// 其他路由：返回 index.html
	r.NoRoute(func(c *gin.Context) {
		// 如果是 API 请求，返回 JSON 的 404
		if strings.HasPrefix(c.Request.URL.Path, "/v1/") {
			public.FailMsg(c, "请求的资源不存在")
			return
		}
		data, err := static.BuildFS.ReadFile("build/index.html")
		if err != nil {
			c.String(http.StatusInternalServerError, "页面加载失败")
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", data)
	})
}
