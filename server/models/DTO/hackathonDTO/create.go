package hackathonDTO

import (
	"server/models"
	"server/models/DTO/awardDTO"
	"server/models/DTO/criteriaDTO"
	"server/models/DTO/stepDTO"
	"time"
)

type CreateDTO struct {
	Name        string `json:"name" validate:"required,min=3,max=100"`
	Description string `json:"description" validate:"required,min=3,max=100"`

	RegDateFrom  time.Time `json:"reg_date_from,omitempty"`
	RegDateTo    time.Time `json:"reg_date_to,omitempty"`
	WorkDateFrom time.Time `json:"work_date_from,omitempty"`
	WorkDateTo   time.Time `json:"work_date_to,omitempty"`
	EvalDateFrom time.Time `json:"eval_date_from,omitempty"`
	EvalDateTo   time.Time `json:"eval_date_to,omitempty"`

	MinTeamSize int `json:"min_team_size" validate:"min=1"`
	MaxTeamSize int `json:"max_team_size" validate:"gtfield=MinTeamSize"`

	OrganizationID uint `json:"organization_id" validate:"required"`

	Technologies []uint               `json:"technologies" validate:"dive,min=1"`
	Criteria     []criteriaDTO.Create `json:"criteria" validate:"required,dive,required"`
	Steps        []stepDTO.Create     `json:"steps" validate:"required,dive,required"`
	Awards       []awardDTO.Create    `json:"awards" validate:"required,dive,required"`
}

func (dto *CreateDTO) ToModel() *models.Hackathon {
	hackathon := &models.Hackathon{
		Name:        dto.Name,
		Description: dto.Description,

		RegDateFrom:  dto.RegDateFrom,
		RegDateTo:    dto.RegDateTo,
		WorkDateFrom: dto.WorkDateFrom,
		WorkDateTo:   dto.WorkDateTo,
		EvalDateFrom: dto.EvalDateFrom,
		EvalDateTo:   dto.EvalDateTo,

		MinTeamSize: dto.MinTeamSize,
		MaxTeamSize: dto.MaxTeamSize,

		OrganizationID: dto.OrganizationID,
		Status:         0,
	}
	return hackathon
}
