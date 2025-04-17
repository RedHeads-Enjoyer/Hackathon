package teamDTO

import "server/models"

type UpdateDTO struct {
	Name *string `json:"name" validate:"required,min=1,max=50"`
}

func (dto *UpdateDTO) ToModel(existingTeam models.Team) *models.Team {
	if dto.Name != nil {
		existingTeam.Name = *dto.Name
	}
	return &existingTeam
}
