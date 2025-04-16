package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func TechnologyRouter(router *gin.Engine, db *gorm.DB) {
	technologyController := controllers.NewTechnologyController(db)

	public := router.Group("/technology")
	{
		public.GET("", technologyController.GetAll)

	}

	protected := router.Group("/technology")
	protected.Use(middlewares.Auth(), middlewares.SystemRole(2))
	{
		public.POST("", technologyController.Create)
		public.GET("/:id", technologyController.GetByID)
		public.PUT("/:id", technologyController.Update)
		public.DELETE("/:id", technologyController.Delete)
	}
}
