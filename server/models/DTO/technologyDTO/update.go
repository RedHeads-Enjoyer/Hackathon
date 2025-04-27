package technologyDTO

import "server/models"

type Update struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=3,max=50"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=255"`
}

func (dto *Update) ToModel(existing *models.Technology) *models.Technology {
	if dto.Name != nil {
		existing.Name = *dto.Name
	}
	if dto.Description != nil {
		existing.Description = *dto.Description
	}
	return existing
}
