package routers

import (
	"github.com/gin-gonic/gin"
	"server/initializers"
)

func Router() *gin.Engine {
	r := gin.Default()

	AuthRouter(r, initializers.DB)
	TechnologyRouter(r, initializers.DB)
	OrganizationRouter(r, initializers.DB)
	FileRouter(r, initializers.DB)
	HackathonRouter(r, initializers.DB)
	UserRouter(r, initializers.DB)
	ChatRouter(r, initializers.DB)

	r.Static("/uploads", "./data/uploads")

	r.MaxMultipartMemory = 1024 << 20
	return r
}
