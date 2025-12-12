package public

import "github.com/gin-gonic/gin"

type Response struct {
	Code    int    `json:"code"`
	Count   int    `json:"count"`
	Data    any    `json:"data"`
	Message string `json:"message"`
	Status  bool   `json:"status"`
}

func SuccessMsg(c *gin.Context, msg string) {
	c.JSON(200, Response{
		Code:    200,
		Count:   0,
		Data:    nil,
		Message: msg,
		Status:  true,
	})
	c.Abort()
}

func SuccessData(c *gin.Context, data interface{}, count int) {
	c.JSON(200, Response{
		Code:    200,
		Count:   count,
		Data:    data,
		Message: "success",
		Status:  true,
	})
	c.Abort()
}

func FailMsg(c *gin.Context, msg string) {
	c.JSON(500, Response{
		Code:    500,
		Count:   0,
		Data:    nil,
		Message: msg,
		Status:  false,
	})
	c.Abort()
}
