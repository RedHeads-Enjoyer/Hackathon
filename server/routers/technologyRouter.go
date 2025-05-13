package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func TechnologyRouter(router *gin.Engine, db *gorm.DB) {
	technologyController := controllers.NewTechnologyController(db)

	protected := router.Group("/technology")
	protected.Use(middlewares.Auth())
	{
		protected.POST("/options", technologyController.GetOptions)
	}

	protected = router.Group("/technology")
	protected.Use(middlewares.Auth(), middlewares.SystemRole(2))
	{
		protected.POST("", technologyController.Create)
		protected.POST("/list", technologyController.GetAll)
		protected.PUT("/:id", technologyController.Update)
		protected.DELETE("/:id", technologyController.Delete)
	}
}
