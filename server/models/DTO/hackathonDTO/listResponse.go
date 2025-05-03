package hackathonDTO

type ListResponse struct {
	List   []interface{} `json:"list"`
	Total  int64         `json:"total"`
	Limit  int           `json:"limit"`
	Offset int           `json:"offset"`
}
