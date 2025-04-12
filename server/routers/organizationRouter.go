package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
)

func OrganizationRouter(router *gin.Engine, db *gorm.DB) {
	organizationController := controllers.NewOrganizationController(db)

	public := router.Group("/organization")
	{
		public.POST("", organizationController.Create)
		public.GET("", organizationController.GetAll)
		public.GET("/full", organizationController.GetAllFull)
		public.GET("/:id", organizationController.GetByID)
		public.GET("/full/:id", organizationController.GetByIDFull)
		public.PUT("/:id", organizationController.Update)
		public.PUT("/:id/verify", organizationController.SetVerified)
		public.DELETE("/:id", organizationController.Delete)
	}
}
