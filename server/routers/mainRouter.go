package routers

import (
	"github.com/gin-gonic/gin"
	"server/initializers"
)

func Router() *gin.Engine {
	r := gin.Default()

	AuthRouter(r, initializers.DB)

	return r
}
