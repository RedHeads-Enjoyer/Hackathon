package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func InviteRouter(router *gin.Engine, db *gorm.DB) {
	inviteController := controllers.NewInviteController(db)
	protectedOrg := router.Group("/hackathon")
	protectedOrg.Use(middlewares.Auth(), middlewares.OrganizationOwnerPath(db))
	{
		protectedOrg.POST("/:hackathon_id/invite/:mentor_id", inviteController.InviteMentor)
		protectedOrg.GET("/:hackathon_id/invites", inviteController.GetMentorInvitations)
	}
}
