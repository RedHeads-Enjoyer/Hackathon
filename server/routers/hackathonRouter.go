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
		public.GET("/:hackathon_id", hackathonController.GetByIDFull)
	}

	protected := router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.OrganizationOwnerPath(db))
	{
		protected.PUT("/:hackathon_id", hackathonController.Update)
		protected.DELETE("/:hackathon_id", hackathonController.Delete)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.OrganizationOwnerBody(db))
	{
		protected.POST("", hackathonController.Create)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth())
	{
		protected.POST("/:hackathon_id/join", hackathonController.AddUser)
		protected.GET("/:hackathon_id/users", hackathonController.GetUsers)
	}
}
