package criteriaDTO

type Get struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	MaxScore uint   `json:"maxScore"`
	MinScore uint   `json:"minScore"`
}
