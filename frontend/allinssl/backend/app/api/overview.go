package api

import (
	"ALLinSSL/backend/internal/overview"
	"ALLinSSL/backend/public"
	"github.com/gin-gonic/gin"
)

func GetOverview(c *gin.Context) {
	// Get the overview data from the database
	overviewData, err := overview.GetOverviewData()
	if err != nil {
		public.FailMsg(c, err.Error())
		return
	}

	// Return the overview data as JSON
	public.SuccessData(c, overviewData, 0)

}
