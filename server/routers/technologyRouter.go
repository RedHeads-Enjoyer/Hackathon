package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
)

func TechnologyRouter(router *gin.Engine, db *gorm.DB) {
	technologyController := controllers.NewTechnologyController(db)

	public := router.Group("/technology")
	{
		public.POST("", technologyController.Create)
		public.GET("", technologyController.GetAll)
		public.GET("/:id", technologyController.GetByID)
		public.PUT("/:id", technologyController.Update)
		public.DELETE("/:id", technologyController.Delete)
	}
}
