package userDTO

type UserWithHackathonRoleDTO struct {
	Username      string `json:"username"`
	Email         string `json:"email"`
	SystemRole    int    `json:"system_role"`
	Avatar        string `json:"avatar_url"`
	HackathonRole int    `json:"hackathon_role"`
}
