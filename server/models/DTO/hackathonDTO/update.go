package hackathonDTO

import (
	"server/models"
	"server/models/DTO/awardDTO"
	"server/models/DTO/criteriaDTO"
	"server/models/DTO/stepDTO"
	"time"
)

type Update struct {
	Name                  *string              `json:"name,omitempty"`
	Description           *string              `json:"description,omitempty"`
	RegDateFrom           *time.Time           `json:"reg_date_from,omitempty"`
	RegDateTo             *time.Time           `json:"reg_date_to,omitempty"`
	WorkDateFrom          *time.Time           `json:"work_date_from,omitempty"`
	WorkDateTo            *time.Time           `json:"work_date_to,omitempty"`
	EvalDateFrom          *time.Time           `json:"eval_date_from,omitempty"`
	EvalDateTo            *time.Time           `json:"eval_date_to,omitempty"`
	MaxTeamSize           *int                 `json:"max_team_size,omitempty"`
	MinTeamSize           *int                 `json:"min_team_size,omitempty"`
	OrganizationID        *uint                `json:"organization_id,omitempty"`
	Steps                 []stepDTO.Create     `json:"steps,omitempty"`
	Awards                []awardDTO.Create    `json:"awards,omitempty"`
	Criteria              []criteriaDTO.Create `json:"criteria,omitempty"`
	Technologies          []uint               `json:"technologies,omitempty"`
	Mentors               []uint               `json:"mentors,omitempty"`
	MentorInvitesToDelete []uint               `json:"mentor_invites_to_delete,omitempty"`
	FilesToDelete         []uint               `json:"files_to_delete,omitempty"`
	DeleteLogo            bool                 `json:"delete_logo,omitempty"`
}

func (dto *Update) ToModel(existingHackathon models.Hackathon) models.Hackathon {
	if dto.Name != nil {
		existingHackathon.Name = *dto.Name
	}

	if dto.Description != nil {
		existingHackathon.Description = *dto.Description
	}

	if dto.RegDateFrom != nil {
		existingHackathon.RegDateFrom = *dto.RegDateFrom
	}

	if dto.RegDateTo != nil {
		existingHackathon.RegDateTo = *dto.RegDateTo
	}

	if dto.WorkDateFrom != nil {
		existingHackathon.WorkDateFrom = *dto.WorkDateFrom
	}

	if dto.WorkDateTo != nil {
		existingHackathon.WorkDateTo = *dto.WorkDateTo
	}

	if dto.EvalDateFrom != nil {
		existingHackathon.EvalDateFrom = *dto.EvalDateFrom
	}

	if dto.EvalDateTo != nil {
		existingHackathon.EvalDateTo = *dto.EvalDateTo
	}

	if dto.MaxTeamSize != nil {
		existingHackathon.MaxTeamSize = *dto.MaxTeamSize
	}

	if dto.MinTeamSize != nil {
		existingHackathon.MinTeamSize = *dto.MinTeamSize
	}

	if dto.OrganizationID != nil {
		existingHackathon.OrganizationID = *dto.OrganizationID
	}

	return existingHackathon
}
