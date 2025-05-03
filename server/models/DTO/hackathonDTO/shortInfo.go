package hackathonDTO

import "time"

type ShortInfo struct {
	ID               uint   `json:"id"`
	Name             string `json:"name"`
	Description      string `json:"description"`
	OrganizationName string `json:"organizationName"` // заменили organization_name на organizationName

	// Даты в camelCase
	RegDateFrom  time.Time `json:"regDateFrom"`
	RegDateTo    time.Time `json:"regDateTo"`
	WorkDateFrom time.Time `json:"workDateFrom"`
	WorkDateTo   time.Time `json:"workDateTo"`
	EvalDateFrom time.Time `json:"evalDateFrom"`
	EvalDateTo   time.Time `json:"evalDateTo"`

	LogoId       uint     `json:"logoId,omitempty"`
	Technologies []string `json:"technologies"`
	TotalAward   float64  `json:"totalAward"`
	MinTeamSize  int      `json:"minTeamSize"`
	MaxTeamSize  int      `json:"maxTeamSize"`
	UserCount    int      `json:"usersCount"`
}
