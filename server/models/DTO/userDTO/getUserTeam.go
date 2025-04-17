package userDTO

type GetUserInTeamMini struct {
	UserID   uint   `json:"user_id"`
	TeamRole int    `json:"team_role"`
	Username string `json:"username"`
}
