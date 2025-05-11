package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func HackathonRouter(router *gin.Engine, db *gorm.DB) {
	hackathonController := controllers.NewHackathonController(db, controllers.NewFileController(db))
	inviteTeamController := controllers.NewTeamInviteController(db)
	public := router.Group("/hackathons")
	{
		public.POST("", hackathonController.GetAll)

	}

	protected := router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.OrganizationOwnerPath(db))
	{
		protected.PUT("/:hackathon_id", hackathonController.Update)
		protected.DELETE("/:hackathon_id", hackathonController.Delete)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth())
	{
		protected.POST("", hackathonController.CreateHackathon)
		protected.GET("/:hackathon_id", hackathonController.GetByIDFull)
		protected.GET("/team/accept/:invite_id", inviteTeamController.AcceptTeamInvite)
		protected.GET("/team/reject/:invite_id", inviteTeamController.RejectTeamInvite)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.HackathonRoleGreater(db, 3))
	{
		protected.GET("/:hackathon_id/edit", hackathonController.GetByIDEditFull)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth())
	{
		protected.GET("/join/:hackathon_id", hackathonController.AddUser)
		protected.POST("/participants/:hackathon_id", hackathonController.GetParticipants)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.HackathonParticipant(db))
	{
		protected.GET("/team/:hackathon_id", hackathonController.GetTeam)
		protected.POST("/team/:hackathon_id", hackathonController.CreateTeam)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.HackathonParticipant(db))
	{
		protected.GET("/team/invite/:hackathon_id/:user_id", inviteTeamController.InviteUser)
		protected.DELETE("/team/:hackathon_id", hackathonController.DeleteTeam)
		protected.GET("/:hackathon_id/team/invite", inviteTeamController.GetTeamInvitesForMe)
	}
}
