package private_ca

import (
	"ALLinSSL/backend/internal/private_ca"
	"ALLinSSL/backend/public"
	"archive/zip"
	"bytes"
	"github.com/gin-gonic/gin"
	"strings"
)

func CreateRootCA(c *gin.Context) {
	var form private_ca.CAConfig
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	err = private_ca.CreateRootCA(form.Name, form.CN, form.O, form.OU, form.C, form.Province, form.Locality, form.Algorithm, form.KeyLength, form.ValidDays)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "根证书创建成功")
	return
}

func CreateIntermediateCA(c *gin.Context) {
	var form private_ca.CAConfig
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	err = private_ca.CreateIntermediateCA(form.Name, form.CN, form.O, form.OU, form.C, form.Province, form.Locality, form.RootId, form.KeyLength, form.ValidDays)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "中间证书创建成功")
	return
}

func GetCAList(c *gin.Context) {
	var form struct {
		Search string `form:"search"`
		Level  string `form:"level"`
		Page   int64  `form:"p"`
		Limit  int64  `form:"limit"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	data, count, err := private_ca.ListCAs(form.Search, form.Level, form.Page, form.Limit)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, count)
	return
}

func DeleteCA(c *gin.Context) {
	var form struct {
		Id int64 `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if form.Id <= 0 {
		public.FailMsg(c, "ID不能为空")
		return
	}
	err = private_ca.DeleteCA(form.Id)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "删除成功")
	return
}

func CreateLeafCert(c *gin.Context) {
	var form private_ca.LeafCertConfig
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	_, err = private_ca.CreateLeafCert(form.CaId, form.Usage, form.KeyLength, form.ValidDays, form.CN, form.SAN)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "证书创建成功")
	return
}

func GetLeafCertList(c *gin.Context) {
	var form struct {
		CaId   int64  `form:"ca_id"`
		Search string `form:"search"`
		Page   int64  `form:"p"`
		Limit  int64  `form:"limit"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	data, count, err := private_ca.ListLeafCerts(form.CaId, form.Search, form.Page, form.Limit)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessData(c, data, count)
	return
}

func DeleteLeafCert(c *gin.Context) {
	var form struct {
		Id string `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if strings.TrimSpace(form.Id) == "" {
		public.FailMsg(c, "ID不能为空")
		return
	}
	err = private_ca.DeleteLeafCerts(form.Id)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "删除成功")
	return
}

func RevokeLeafCert(c *gin.Context) {
	var form struct {
		Id         string `form:"id"`
		Reason     int    `form:"reason"`
		ReasonNote string `form:"reason_note"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if strings.TrimSpace(form.Id) == "" {
		public.FailMsg(c, "ID不能为空")
		return
	}
	err = private_ca.RevokeLeafCerts(form.Id, form.Reason, strings.TrimSpace(form.ReasonNote))
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "吊销成功")
	return
}

func DownloadCRL(c *gin.Context) {
	var form struct {
		Id int64 `form:"id"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if form.Id <= 0 {
		public.FailMsg(c, "CA ID不能为空")
		return
	}
	crlPEM, filename, err := private_ca.GenerateCRL(form.Id)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	c.Header("Content-Type", "application/pkix-crl")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(200, "application/pkix-crl", crlPEM)
	return
}

// DownloadCRLPublic 公开 CRL 下载，供证书 CDP 扩展引用（无需登录）。
// 参数：ca_id
func DownloadCRLPublic(c *gin.Context) {
	var form struct {
		CaId int64 `form:"ca_id"`
	}
	_ = c.Bind(&form)
	if form.CaId <= 0 {
		// 兼容 id
		var alt struct {
			Id int64 `form:"id"`
		}
		_ = c.Bind(&alt)
		form.CaId = alt.Id
	}
	if form.CaId <= 0 {
		public.FailMsg(c, "ca_id不能为空")
		return
	}
	crlPEM, filename, err := private_ca.GenerateCRL(form.CaId)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	c.Header("Content-Type", "application/pkix-crl")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Cache-Control", "public, max-age=3600")
	c.Data(200, "application/pkix-crl", crlPEM)
}

// HandleOCSP 公开 OCSP 应答（无需登录）
func HandleOCSP(c *gin.Context) {
	private_ca.HandleOCSP(c)
}

func DownloadCert(c *gin.Context) {
	var form struct {
		Id   int64  `form:"id"`
		Type string `form:"type"`
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if form.Id <= 0 {
		public.FailMsg(c, "ID不能为空")
		return
	}
	certData, err := private_ca.GetCert(form.Id, form.Type)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if certData == nil {
		public.FailMsg(c, "证书不存在")
		return
	}

	// 构建 zip 包（内存中）
	buf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(buf)

	certStr := certData["cert"].(string)
	certWriter, err := zipWriter.Create("cert.pem")
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if _, err := certWriter.Write([]byte(certStr)); err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	// key.pem
	keyStr := certData["key"].(string)
	keyWriter, err := zipWriter.Create("key.pem")
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if _, err := keyWriter.Write([]byte(keyStr)); err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if certData["en_cert"] != nil && certData["en_key"] != nil {
		// en_cert.pem
		enCertStr := certData["en_cert"].(string)
		enCertWriter, err := zipWriter.Create("en_cert.pem")
		if err != nil {
			public.FailMsg(c, err.Error())
			return
		}
		if _, err := enCertWriter.Write([]byte(enCertStr)); err != nil {
			public.FailMsg(c, err.Error())
			return
		}
		// en_key.pem
		enKeyStr := certData["en_key"].(string)
		enKeyWriter, err := zipWriter.Create("en_key.pem")
		if err != nil {
			public.FailMsg(c, err.Error())
			return
		}
		if _, err := enKeyWriter.Write([]byte(enKeyStr)); err != nil {
			public.FailMsg(c, err.Error())
			return
		}
	}

	if certData["algorithm"] == "ecdsa" || certData["algorithm"] == "rsa" {
		// cert.pfx
		pfxPassword := "allinssl"
		pfxData, err := public.PEMToPFX(certStr, keyStr, pfxPassword)
		if err == nil && len(pfxData) > 0 {
			pfxWriter, err := zipWriter.Create("IIS/cert.pfx")
			if err != nil {
				public.FailMsg(c, err.Error())
				return
			}
			if _, err := pfxWriter.Write(pfxData); err != nil {
				public.FailMsg(c, err.Error())
				return
			}
			txtWriter, err := zipWriter.Create("IIS/passwd.txt")
			if err != nil {
				public.FailMsg(c, err.Error())
				return
			}
			if _, err := txtWriter.Write([]byte(pfxPassword)); err != nil {
				public.FailMsg(c, err.Error())
				return
			}
		}
	}

	// 关闭 zipWriter
	if err := zipWriter.Close(); err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	// 设置响应头
	zipName := strings.ReplaceAll(certData["cn"].(string), ".", "_")
	zipName = strings.ReplaceAll(zipName, ",", "-")
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", "attachment; filename="+zipName+".zip")
	c.Data(200, "application/zip", buf.Bytes())
	return
}
