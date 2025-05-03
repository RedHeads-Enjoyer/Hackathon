package criteriaDTO

import "server/models"

type Create struct {
	Name     string `json:"name" validate:"required,min=3,max=100"`
	MaxScore uint   `json:"max_score" validate:"min=0"`
	MinScore uint   `json:"min_score" validate:"min=0"`
}

func (dto *Create) ToModel(hackathonID uint) *models.Criteria {
	return &models.Criteria{
		Name:        dto.Name,
		MaxScore:    dto.MaxScore,
		MinScore:    dto.MinScore,
		HackathonID: hackathonID,
	}
}
