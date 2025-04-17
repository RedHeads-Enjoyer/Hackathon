package technology

import "server/models"

type TechnologyCreateDTO struct {
	Name        string `json:"name" validate:"required,min=1,max=50"`
	Description string `json:"description,omitempty" validate:"max=255"`
}

type TechnologyUpdateDTO struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=3,max=50"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=255"`
}

func (dto *TechnologyCreateDTO) ToModel() *models.Technology {
	return &models.Technology{
		Name:        dto.Name,
		Description: dto.Description,
	}
}

func (dto *TechnologyUpdateDTO) ToModel(existing *models.Technology) *models.Technology {
	if dto.Name != nil {
		existing.Name = *dto.Name
	}
	if dto.Description != nil {
		existing.Description = *dto.Description
	}
	return existing
}
