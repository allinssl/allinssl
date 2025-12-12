package public

import (
	"github.com/mojocn/base64Captcha"
	"image/color"
)

var codeDefaultDriver = base64Captcha.NewDriverString(
	1000,
	1200,
	0,
	base64Captcha.OptionShowSlimeLine,
	4,
	"23456789abcdefghjkmnpqrstuvwxyz",
	&color.RGBA{
		R: 225,
		G: 225,
		B: 200,
		A: 255,
	},
	nil,
	[]string{"wqy-microhei.ttc", "RitaSmith.ttf"},
)

// GenerateCode 生成图形化字符串验证码
func GenerateCode() (string, string, string, error) {
	// 生成默认数字的driver
	codeId, content, _ := codeDefaultDriver.GenerateIdQuestionAnswer() // 生成验证码和随机id
	item, err := codeDefaultDriver.DrawCaptcha(content)                // 生成验证码图片
	if err != nil {
		return "", "", "", err
	}
	b64s := item.EncodeB64string()
	return codeId, b64s, content, nil
}
