package userDTO

type ParticipantResponse struct {
	ID        uint    `json:"id"`
	Username  string  `json:"username"`
	TeamName  *string `json:"team"`
	CanInvite int     `json:"canInvite"`
}
