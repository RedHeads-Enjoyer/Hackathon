package technologyDTO

import "server/models"

type Create struct {
	Name        string `json:"name" validate:"required,min=1,max=50"`
	Description string `json:"description,omitempty" validate:"max=255"`
}

func (dto *Create) ToModel() *models.Technology {
	return &models.Technology{
		Name:        dto.Name,
		Description: dto.Description,
	}
}
