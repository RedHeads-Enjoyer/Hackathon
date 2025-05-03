package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func FileRouter(router *gin.Engine, db *gorm.DB) {
	fileController := controllers.NewFileController(db)

	protected := router.Group("/file")
	protected.Use(middlewares.Auth())
	{
		protected.GET("/:file_id", fileController.GetFile)
	}
}
