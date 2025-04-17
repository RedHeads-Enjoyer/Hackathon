package teamDTO

import "server/models/DTO/userDTO"

type GetDTO struct {
	ID          uint                        `json:"id"`
	Name        string                      `json:"name"`
	HackathonID uint                        `json:"hackathon_id"`
	Users       []userDTO.GetUserInTeamMini `json:"users"`
}
