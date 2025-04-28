package hackathonDTO

import (
	"server/models"
	"server/models/DTO/awardDTO"
	"server/models/DTO/criteriaDTO"
	"time"
)

type HackathonUpdateDTO struct {
	Name           *string                         `json:"name,omitempty"`
	Description    *string                         `json:"description,omitempty"`
	RegDateFrom    *time.Time                      `json:"reg_date_from,omitempty"`
	RegDateTo      *time.Time                      `json:"reg_date_to,omitempty"`
	StartDate      *time.Time                      `json:"start_date,omitempty"`
	EndDate        *time.Time                      `json:"end_date,omitempty"`
	MaxTeams       *int                            `json:"max_teams,omitempty"`
	MaxTeamSize    *int                            `json:"max_team_size,omitempty"`
	MinTeamSize    *int                            `json:"min_team_size,omitempty"`
	StatusID       *uint                           `json:"status_id,omitempty"`
	OrganizationID *uint                           `json:"organization_id,omitempty"`
	Steps          []HackathonStepCreateDTO        `json:"steps,omitempty"`
	Awards         []awardDTO.AwardCreateDTO       `json:"awards,omitempty"`
	Criteria       []criteriaDTO.CriteriaCreateDTO `json:"criteria,omitempty"`
}

// ToModel обновляет существующий хакатон на основе данных из DTO
func (dto *HackathonUpdateDTO) ToModel(existingHackathon models.Hackathon) models.Hackathon {
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

	if dto.MaxTeamSize != nil {
		existingHackathon.MaxTeamSize = *dto.MaxTeamSize
	}

	if dto.MinTeamSize != nil {
		existingHackathon.MinTeamSize = *dto.MinTeamSize
	}

	if dto.StatusID != nil {
		existingHackathon.StatusID = *dto.StatusID
	}

	if dto.OrganizationID != nil {
		existingHackathon.OrganizationID = *dto.OrganizationID
	}

	return existingHackathon
}
