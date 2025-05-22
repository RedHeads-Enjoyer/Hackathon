package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func HackathonRouter(router *gin.Engine, db *gorm.DB) {
	hackathonController := controllers.NewHackathonController(db, controllers.NewFileController(db))

	protected := router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.OrganizationOwnerPath(db))
	{
		protected.PUT("/:hackathon_id", hackathonController.Update)
		protected.DELETE("/:hackathon_id", hackathonController.Delete)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth())
	{
		protected.POST("/list", hackathonController.GetAll)
		protected.POST("", hackathonController.CreateHackathon)
		protected.GET("/:hackathon_id", hackathonController.GetByIDFull)
		protected.GET("/team/accept/:invite_id", hackathonController.AcceptTeamInvite)
		protected.GET("/team/reject/:invite_id", hackathonController.RejectTeamInvite)
		protected.GET("/team/leave/:hackathon_id", hackathonController.LeaveTeam)
		protected.GET("/team/kick/:hackathon_id/:user_id", hackathonController.KickTeam)
		protected.GET("/:hackathon_id/project", hackathonController.GetTeamProject)
		protected.POST("/:hackathon_id/project", hackathonController.UploadTeamProject)
	}

	protected = router.Group("hackathon/mentor/invite")
	protected.Use(middlewares.Auth())
	{
		protected.GET("", hackathonController.GetMyMentorInvites)
		protected.GET("/accept/:invite_id", hackathonController.AcceptMentorInvite)
		protected.GET("/reject/:invite_id", hackathonController.RejectMentorInvite)
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
		protected.GET("/:hackathon_id/role", hackathonController.GetHackathonRole)
	}

	protected = router.Group("/hackathon")
	protected.Use(middlewares.Auth(), middlewares.HackathonParticipant(db))
	{
		protected.GET("/team/invite/:hackathon_id/:user_id", hackathonController.InviteUser)
		protected.DELETE("/team/:hackathon_id", hackathonController.DeleteTeam)
		protected.GET("/:hackathon_id/team/invite", hackathonController.GetTeamInvitesForMe)
		protected.POST("/:hackathon_id/validate/projects", hackathonController.GetValidateProjects)
		protected.POST("/:hackathon_id/team/:team_id/rating", hackathonController.SubmitProjectRating)
		protected.GET("/:hackathon_id/results", hackathonController.GetResults)
	}
}
