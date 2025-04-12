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

	return r
}
