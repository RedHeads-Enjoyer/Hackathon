package hackathonDTO

import (
	"server/models"
	"time"
)

type HackathonStepCreateDTO struct {
	Name        string    `json:"name" validate:"required,min=3,max=500"`
	Description string    `json:"description" validate:"max=5000"`
	StartDate   time.Time `json:"start_date" validate:"required"`
	EndDate     time.Time `json:"end_date" validate:"required,gtfield=StartDate"`
}

func (dto *HackathonStepCreateDTO) ToModel(hackathonID uint) *models.HackathonStep {
	return &models.HackathonStep{
		Name:        dto.Name,
		Description: dto.Description,
		StartDate:   dto.StartDate,
		EndDate:     dto.EndDate,
		HackathonID: hackathonID,
	}
}
