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

	protectedOrg := router.Group("/hackathon")
	protectedOrg.Use(middlewares.Auth(), middlewares.OrganizationOwner(db))
	{
		protectedOrg.PUT("/:id", hackathonController.Update)
		protectedOrg.POST("", hackathonController.Create)
		protectedOrg.DELETE("/:id", hackathonController.Delete)
	}

	protectedAuth := router.Group("/hackathon")
	protectedAuth.Use(middlewares.Auth())
	{
		protectedAuth.POST("/:id/join", hackathonController.AddUser)
		protectedAuth.GET("/:id/users", hackathonController.GetUsers)
	}
}
