package api

import (
	"ALLinSSL/backend/internal/setting"
	"ALLinSSL/backend/public"
	"github.com/gin-gonic/gin"
	"os"
	"path/filepath"
)

func GetSetting(c *gin.Context) {
	data, err := setting.Get()
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, 0)
}

func SaveSetting(c *gin.Context) {
	var data setting.Setting
	if err := c.Bind(&data); err != nil {
		public.FailMsg(c, "参数错误")
		return
	}
	if err := setting.Save(&data); err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "保存成功")

}

func Shutdown(c *gin.Context) {
	setting.Shutdown()
	public.SuccessMsg(c, "关闭成功")
}

func Restart(c *gin.Context) {
	setting.Restart()
	public.SuccessMsg(c, "正在重启...")
}

func GetVersion(c *gin.Context) {
	data, err := setting.GetVersion()
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, 0)
}

func DownloadData(c *gin.Context) {
	dbPath := "data/data.db"
	dbName := filepath.Base(dbPath)

	// 设置响应头，让浏览器下载文件
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename=\""+dbName+"\"")
	c.File(dbPath)
}

func UploadData(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		public.FailMsg(c, "文件上传失败: "+err.Error())
		return
	}
	// 检查文件类型
	if filepath.Ext(file.Filename) != ".db" {
		public.FailMsg(c, "只允许上传 .db 文件")
		return
	}
	// 备份源文件
	// 修改源文件名为 data.db.bak
	err = os.Rename("data/data.db", "data/data.db.bak")
	if err != nil {
		public.FailMsg(c, "备份源文件失败: "+err.Error())
		return
	}

	if err := c.SaveUploadedFile(file, "data/data.db"); err != nil {
		public.FailMsg(c, "保存文件失败: "+err.Error())
		return
	}

	public.SuccessMsg(c, "数据上传成功")
}
