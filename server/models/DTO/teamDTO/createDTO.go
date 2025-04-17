package teamDTO

import "server/models"

type CreateDTO struct {
	Name string `json:"name" validate:"required,min=1,max=50"`
}

func (dto *CreateDTO) ToModel() *models.Team {
	team := &models.Team{
		Name: dto.Name,
	}
	return team
}
