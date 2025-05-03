package hackathonDTO

type ListResponse struct {
	List   []ShortInfo `json:"list"`
	Total  int64       `json:"total"`
	Limit  int         `json:"limit"`
	Offset int         `json:"offset"`
}
