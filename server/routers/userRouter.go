package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func UserRouter(router *gin.Engine, db *gorm.DB) {
	userController := controllers.NewUserController(db, controllers.NewFileController(db))

	public := router.Group("/user")
	{
		public.GET("", userController.GetAll)
		public.GET("/:id", userController.GetByID)

	}

	protected := router.Group("/auth")
	protected.Use(middlewares.Auth(), middlewares.User())
	{
		public.PUT("/:id", userController.Update)
		public.DELETE("/:id", userController.Delete)
	}
}
