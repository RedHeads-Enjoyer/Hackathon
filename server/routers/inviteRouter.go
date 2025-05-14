package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func InviteRouter(router *gin.Engine, db *gorm.DB) {
	inviteController := controllers.NewInviteController(db)

	protected := router.Group("hackathon/mentor/invite")
	protected.Use(middlewares.Auth())
	{
		protected.GET("", inviteController.GetMyMentorInvites)
		protected.GET("/accept/:invite_id", inviteController.AcceptMentorInvite)
		protected.GET("/reject/:invite_id", inviteController.RejectMentorInvite)
	}
}
