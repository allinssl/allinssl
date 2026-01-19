package private_ca

import (
	"ALLinSSL/backend/internal/private_ca"
	"ALLinSSL/backend/public"
	"github.com/gin-gonic/gin"
)

func CreateLeafCert(c *gin.Context) {
	var form struct {
		CaId     int64  `form:"ca_id"`
		Usage    int64  `form:"usage"`
		KeyLength int64 `form:"key_length"`
		ValidDays int64 `form:"valid_days"`
		CN       string `form:"cn"`
		SAN      string `form:"san"`
		KeyPass  string `form:"key_pass"` // 新增
	}
	err := c.Bind(&form)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	_, err = private_ca.CreateLeafCertWithPass(form.CaId, form.Usage, form.KeyLength, form.ValidDays, form.CN, form.SAN, form.KeyPass)
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}
	public.SuccessMsg(c, "证书创建成功")
	return
}