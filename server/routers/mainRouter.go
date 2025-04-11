package routers

import (
	"github.com/gin-gonic/gin"
)

func Router() *gin.Engine {
	r := gin.Default()

	//AuthRouter(r, initializers.DB)

	r.GET("/ping", func(c *gin.Context) {
		c.String(200, "Hello World")
	})

	return r
}
