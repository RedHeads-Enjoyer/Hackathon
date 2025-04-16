package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func HackathonRouter(router *gin.Engine, db *gorm.DB) {
	hackathonController := controllers.NewHackathonController(db)
	public := router.Group("/hackathon")
	{
		public.GET("", hackathonController.GetAll)
		public.GET("/full", hackathonController.GetAllFull)
		public.GET("/:id", hackathonController.GetByIDFull)
	}

	protected := router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.OrganizationOwner(db))
	{
		public.PUT("/:id", hackathonController.Update)
		protected.POST("", hackathonController.Create)
		public.DELETE("/:id", hackathonController.Delete)
	}
}
