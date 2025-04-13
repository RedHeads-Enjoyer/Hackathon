package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
)

func UserRouter(router *gin.Engine, db *gorm.DB) {
	userController := controllers.NewUserController(db, controllers.NewFileController(db))

	public := router.Group("/user")
	{
		public.GET("", userController.GetAll)
		public.PUT("/:id", userController.Update)
		public.GET("/:id", userController.GetByID)
		public.DELETE("/:id", userController.Delete)
	}
}
