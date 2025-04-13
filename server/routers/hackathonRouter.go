package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
)

func HackathonRouter(router *gin.Engine, db *gorm.DB) {
	hackathonController := controllers.NewHackathonController(db)

	public := router.Group("/hackathon")
	{
		public.POST("", hackathonController.Create)
		public.GET("", hackathonController.GetAll)
		public.GET("/full", hackathonController.GetAllFull)
		//public.GET("/full", organizationController.GetAllFull)
		//public.GET("/:id", organizationController.GetByID)
		//public.GET("/full/:id", organizationController.GetByIDFull)
		//public.PUT("/:id", organizationController.Update)
		//public.PUT("/:id/verify", organizationController.SetVerified)
		//public.DELETE("/:id", organizationController.Delete)
	}
}
