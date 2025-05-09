package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func InviteRouter(router *gin.Engine, db *gorm.DB) {
	inviteController := controllers.NewInviteController(db)
	protected := router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.OrganizationOwnerPath(db))
	{
		protected.POST("/:hackathon_id/invite/:mentor_id", inviteController.InviteMentor)
		protected.GET("/:hackathon_id/invites", inviteController.GetMentorInvitations)
	}

	protected = router.Group("/invites/mentor")
	protected.Use(middlewares.Auth())
	{
		protected.GET("", inviteController.GetMyMentorInvites)
		protected.GET("/accept/:invite_id", inviteController.AcceptMentorInvite)
		protected.GET("/reject/:invite_id", inviteController.RejectMentorInvite)
	}
}
