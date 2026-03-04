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
	err = private_ca.DeleteLeafCert(form.Id)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "删除成功")
	return
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
	issuerCert := ""
	if form.Type == "leaf" {
		if caID, ok := certData["ca_id"]; ok && caID != nil {
			var caIdInt64 int64
			switch v := caID.(type) {
			case int64:
				caIdInt64 = v
			case int:
				caIdInt64 = int64(v)
			case float64:
				caIdInt64 = int64(v)
			}
			if caIdInt64 > 0 {
				if issuerData, err := private_ca.GetCert(caIdInt64, "ca"); err == nil {
					if issuer, ok := issuerData["cert"].(string); ok {
						issuerCert = issuer
					}
				}
			}
		}
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
	// fullchain.pem
	fullchain := public.BuildFullChain(certStr, issuerCert)
	fullchainWriter, err := zipWriter.Create("fullchain.pem")
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	if _, err := fullchainWriter.Write([]byte(fullchain)); err != nil {
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
		pfxData, err := public.PEMToPFX(fullchain, keyStr, pfxPassword)
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
