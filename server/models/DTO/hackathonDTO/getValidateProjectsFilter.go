package hackathonDTO

type GetValidateProjectsFilter struct {
	Validate int `json:"validate"`
	Limit    int `json:"limit"`
	Offset   int `json:"offset"`
}
