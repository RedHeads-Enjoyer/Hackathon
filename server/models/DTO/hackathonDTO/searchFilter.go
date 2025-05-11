package hackathonDTO

type FilterData struct {
	Name           string  `json:"name"`
	OrganizationId uint    `json:"organizationId"`
	StartDate      string  `json:"startDate"`
	EndDate        string  `json:"endDate"`
	MinTeamSize    int     `json:"minTeamSize"`
	MaxTeamSize    int     `json:"maxTeamSize"`
	TechnologyId   uint    `json:"technologyId"`
	Role           int     `json:"role"`
	TotalAward     float64 `json:"totalAward"`
	Limit          int     `json:"limit"`
	Offset         int     `json:"offset"`
}
