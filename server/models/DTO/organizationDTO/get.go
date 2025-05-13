package organizationDTO

import "time"

type Get struct {
	ID           uint      `json:"id"`
	LegalName    string    `json:"legalName"`
	INN          string    `json:"INN"`
	OGRN         string    `json:"OGRN"`
	ContactEmail string    `json:"contactEmail"`
	Website      string    `json:"website"`
	CreatedAt    time.Time `json:"CreatedAt"`
	UpdatedAt    time.Time `json:"UpdatedAt"`
	Status       int       `json:"status"`
}
