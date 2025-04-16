package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func OrganizationRouter(router *gin.Engine, db *gorm.DB) {
	organizationController := controllers.NewOrganizationController(db)

	protected := router.Group("/organization")
	protected.Use(middlewares.Auth())
	{
		protected.POST("", organizationController.Create)
		protected.GET("/my", organizationController.GetMy)
	}

	public := router.Group("/organization")
	{
		public.GET("", organizationController.GetAll)
		public.GET("/:id", organizationController.GetByID)
	}

	owner := router.Group("/organization")
	owner.Use(middlewares.Auth(), middlewares.Owner())
	{
		public.PUT("/:id", organizationController.Update)
		public.GET("/full/:id", organizationController.GetByIDFull)
		public.DELETE("/:id", organizationController.Delete)
	}

	system := router.Group("/organization")
	system.Use(middlewares.Auth(), middlewares.SystemRole(2))
	{
		system.PUT("/:id/verify", organizationController.SetVerified)
		system.GET("/full", organizationController.GetAllFull)
	}
}
