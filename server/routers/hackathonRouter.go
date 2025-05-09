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
		protected.GET("/participants/:hackathon_id", hackathonController.GetUsers)
		protected.GET("/team/:team_id", inviteTeamController.GetTeamMembers)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.HackathonParticipant(db))
	{
		protected.GET("/:hackathon_id/team", hackathonController.GetTeams)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.HackathonParticipant(db), middlewares.HackathonRoleLower(db, 2))
	{
		protected.POST("/:hackathon_id/team", hackathonController.CreateTeam)
		protected.GET("/:hackathon_id/team/invite", inviteTeamController.GetTeamInvitesForMe)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.HackathonParticipant(db), middlewares.HackathonRoleLower(db, 2), middlewares.TeamRole(db, 2))
	{
		protected.PUT("/:hackathon_id/team/:team_id", hackathonController.UpdateTeam)
		protected.POST("/:hackathon_id/team/:team_id/invite/:user_id", inviteTeamController.InviteUser)

	}
}
