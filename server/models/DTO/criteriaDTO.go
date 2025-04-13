package DTO

import "server/models"

type CriteriaCreateDTO struct {
	Name        string `json:"name" validate:"required,min=3,max=100"`
	Description string `json:"description,omitempty" validate:"max=500"`
	MaxScore    *uint  `json:"max_score" validate:"required,min=0"`
	MinScore    *uint  `json:"min_score" validate:"required,min=0"`
}

func (dto *CriteriaCreateDTO) ToModel(hackathonID uint) *models.Criteria {
	return &models.Criteria{
		Name:        dto.Name,
		Description: dto.Description,
		MaxScore:    dto.MaxScore,
		MinScore:    dto.MinScore,
		HackathonID: hackathonID,
	}
}
