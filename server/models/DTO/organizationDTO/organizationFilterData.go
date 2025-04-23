package organizationDTO

type OrganizationFilterData struct {
	LegalName    string `json:"legalName"`
	INN          string `json:"INN"`
	OGRN         string `json:"OGRN"`
	ContactEmail string `json:"contactEmail"`
	Website      string `json:"website"`
	Status       int    `json:"status"`
	Limit        int    `json:"limit"`
	Offset       int    `json:"offset"`
}
