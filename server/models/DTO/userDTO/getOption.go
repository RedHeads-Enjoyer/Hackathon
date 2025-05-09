package userDTO

type GetOption struct {
	Id   int    `json:"value" gorm:"column:value"`
	Name string `json:"label" gorm:"column:label"`
}
