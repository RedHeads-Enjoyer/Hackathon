package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func AuthRouter(router *gin.Engine, db *gorm.DB) {
	authController := controllers.NewAuthController(db)

	public := router.Group("/auth")
	{
		public.POST("/register", authController.RegisterHandler)
		public.POST("/login", authController.LoginHandler)

	}

	protected := router.Group("/auth")
	protected.Use(middlewares.Auth())
	{
		protected.POST("/refresh", authController.RefreshTokenHandler)
		protected.GET("/verify", authController.CurrentUserHandler)
		protected.POST("/logout", authController.LogoutHandler)
	}
}
