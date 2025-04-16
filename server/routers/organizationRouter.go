package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func OrganizationRouter(router *gin.Engine, db *gorm.DB) {
	organizationController := controllers.NewOrganizationController(db)

	public := router.Group("/organization")
	{
		public.GET("", organizationController.GetAll)
		public.GET("/full", organizationController.GetAllFull)
		public.GET("/:id", organizationController.GetByID)
		public.GET("/full/:id", organizationController.GetByIDFull)
		public.PUT("/:id", organizationController.Update)

		public.DELETE("/:id", organizationController.Delete)
	}

	protected := router.Group("/organization")
	protected.Use(middlewares.Auth())
	{
		protected.POST("", organizationController.Create)
	}

	system := router.Group("/organization")
	protected.Use(middlewares.Auth(), middlewares.SystemRole(2))
	{
		system.PUT("/:id/verify", organizationController.SetVerified)
	}
}
