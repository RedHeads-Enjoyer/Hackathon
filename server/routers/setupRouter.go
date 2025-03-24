package routers

import (
	"github.com/gin-gonic/gin"
	"server/controllers"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.POST("/signup", controllers.Signup)

	return r
}
