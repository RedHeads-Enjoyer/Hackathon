package hackathonDTO

type ShortInfo struct {
	Name string `json:"name"`

	OrganizationId   uint `json:"organizationId"`
	OrganizationName uint `json:"organizationName"`

	StartDate    string  `json:"startDate"`
	EndDate      string  `json:"endDate"`
	MinTeamSize  int     `json:"minTeamSize"`
	MaxTeamSize  int     `json:"maxTeamSize"`
	TechnologyId uint    `json:"technologyId"`
	TotalAward   float64 `json:"totalAward"`
}
