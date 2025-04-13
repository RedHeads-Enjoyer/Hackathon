package DTO

import (
	"server/models"
	"time"
)

type HackathonCreateDTO struct {
	Name        string `json:"name" validate:"required,min=3,max=100"`
	Description string `json:"description" validate:"required,min=3,max=100"`

	RegDateFrom time.Time `json:"reg_date_from" validate:"required"`
	RegDateTo   time.Time `json:"reg_date_to" validate:"required,gtfield=RegDateFrom"`
	StartDate   time.Time `json:"start_date" validate:"required,gtfield=RegDateTo"`
	EndDate     time.Time `json:"end_date" validate:"required,gtfield=StartDate"`

	MaxTeams    *int `json:"max_teams,omitempty" validate:"omitempty,min=1"`
	MinTeamSize int  `json:"min_team_size" validate:"min=1"`
	MaxTeamSize int  `json:"max_team_size" validate:"gtfield=MinTeamSize"`

	OrganizationID uint                `json:"organization_id" validate:"required"`
	Technologies   []uint              `json:"technologies" validate:"dive,min=1"`
	Criteria       []CriteriaCreateDTO `json:"criteria" validate:"required,dive,required"`

	Logo *string `json:"logo_url,omitempty" validate:"omitempty,url"`

	Steps  []HackathonStepCreateDTO `json:"steps" validate:"required,dive,required"`
	Goals  []string                 `json:"goals" validate:"dive,min=1,max=255,required"`
	Awards []AwardCreateDTO         `json:"awards" validate:"required,dive,required"`

	Files []FileDTO `json:"files" validate:"required,dive,required"`
}

func (dto *HackathonCreateDTO) ToModel() *models.Hackathon {
	hackathon := &models.Hackathon{
		Name:        dto.Name,
		Description: dto.Description,

		RegDateFrom: dto.RegDateFrom,
		RegDateTo:   dto.RegDateTo,
		StartDate:   dto.StartDate,
		EndDate:     dto.EndDate,

		MaxTeams:    dto.MaxTeams,
		MinTeamSize: dto.MinTeamSize,
		MaxTeamSize: dto.MaxTeamSize,

		OrganizationID: dto.OrganizationID,
		StatusID:       1,
	}
	return hackathon
}

type FileDTO struct {
	Name       string `json:"name"`
	StoredName string `json:"stored_name"`
	URL        string `json:"url"`
	Size       int64  `json:"size"`
	Type       string `json:"type"`
}
