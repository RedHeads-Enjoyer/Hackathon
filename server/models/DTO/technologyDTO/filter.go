package technologyDTO

type Filter struct {
	Name   string `json:"name"`
	Status int    `json:"status"`
	Limit  int    `json:"limit"`
	Offset int    `json:"offset"`
}
