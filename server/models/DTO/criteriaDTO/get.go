package criteriaDTO

type Get struct {
	Name     string `json:"name"`
	MaxScore uint   `json:"maxScore"`
	MinScore uint   `json:"minScore"`
}
