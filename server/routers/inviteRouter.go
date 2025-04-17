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

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth())
	{
		protected.POST("/accept/:invite_id", inviteController.AcceptMentorInvite)
		protected.POST("/reject/:invite_id", inviteController.RejectMentorInvite)
		protected.GET("/invites/in", inviteController.GetInvitesToMe)
	}

}
