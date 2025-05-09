package userDTO

type TeamData struct {
	Name         *string           `json:"name"`
	Participants []TeamParticipant `json:"participants"`
}
