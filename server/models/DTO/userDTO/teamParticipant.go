package userDTO

type TeamParticipant struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	TeamRole int    `json:"teamRole"`
}
