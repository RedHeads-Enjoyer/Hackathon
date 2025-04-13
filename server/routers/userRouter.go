package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
)

func UserRouter(router *gin.Engine, db *gorm.DB) {
	userController := controllers.NewUserController(db)

	public := router.Group("/user")
	{
		public.GET("", userController.GetAll)
		public.PUT("/:id", userController.Update)
	}
}
