package stepDTO

import (
	"server/models"
	"time"
)

type Create struct {
	Name        string    `json:"name" validate:"required,max=255"`
	Description string    `json:"description" validate:"max=2000"`
	StartDate   time.Time `json:"start_date" validate:"required"`
	EndDate     time.Time `json:"end_date" validate:"required,gtefield=StartDate"`
}

func (dto *Create) ToModel(hackathonID uint) *models.HackathonStep {
	return &models.HackathonStep{
		Name:        dto.Name,
		Description: dto.Description,
		StartDate:   dto.StartDate,
		EndDate:     dto.EndDate,
		HackathonID: hackathonID,
	}
}
