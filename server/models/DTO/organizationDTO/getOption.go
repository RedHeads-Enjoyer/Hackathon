package organizationDTO

type GetOption struct {
	Id        int    `json:"value" gorm:"column:value"`
	LegalName string `json:"label" gorm:"column:label"`
}
