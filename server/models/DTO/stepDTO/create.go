package stepDTO

import (
	"server/models"
	"time"
)

type Create struct {
	Name        string    `json:"name" validate:"required,min=3,max=50"`
	Description string    `json:"description" validate:"max=500"`
	StartDate   time.Time `json:"start_date" validate:"required"`
	EndDate     time.Time `json:"end_date" validate:"required,gtfield=StartDate"`
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
