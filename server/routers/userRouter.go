package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func UserRouter(router *gin.Engine, db *gorm.DB) {
	userController := controllers.NewUserController(db)

	protected := router.Group("/user")
	protected.Use(middlewares.Auth())
	{
		protected.POST("/options", userController.GetOptions)
	}
}
