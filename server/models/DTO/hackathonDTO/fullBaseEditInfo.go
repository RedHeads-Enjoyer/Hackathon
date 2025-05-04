package hackathonDTO

import (
	"server/models/DTO/awardDTO"
	"server/models/DTO/criteriaDTO"
	"server/models/DTO/fileDTO"
	"server/models/DTO/hackathonStepDTO"
	"server/models/DTO/technologyDTO"
	"time"
)

type FullBaseEditInfo struct {
	ID               uint   `json:"id"`
	Name             string `json:"name"`
	Description      string `json:"description"`
	OrganizationId   uint   `json:"organizationId"`
	OrganizationName string `json:"organizationName"`

	RegDateFrom  time.Time `json:"regDateFrom"`
	RegDateTo    time.Time `json:"regDateTo"`
	WorkDateFrom time.Time `json:"workDateFrom"`
	WorkDateTo   time.Time `json:"workDateTo"`
	EvalDateFrom time.Time `json:"evalDateFrom"`
	EvalDateTo   time.Time `json:"evalDateTo"`

	Status int `json:"status"`

	LogoId      uint    `json:"logoId,omitempty"`
	TotalAward  float64 `json:"totalAward"`
	MinTeamSize int     `json:"minTeamSize"`
	MaxTeamSize int     `json:"maxTeamSize"`
	UserCount   int     `json:"usersCount"`

	Files        []fileDTO.GetShort       `json:"files"`
	Steps        []hackathonStepDTO.Get   `json:"steps"`
	Awards       []awardDTO.Get           `json:"awards"`
	Technologies []technologyDTO.GetShort `json:"technologies"`
	Criteria     []criteriaDTO.Get        `json:"criteria"`

	HackathonRole int `json:"hackathonRole"`
}
