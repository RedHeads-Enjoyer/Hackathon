package organizationDTO

import "server/models"

type OrganizationCreate struct {
	LegalName    string `json:"legalName" validate:"required,max=255"`
	INN          string `json:"INN" validate:"required,len=12"`
	OGRN         string `json:"OGRN,required,len=13"`
	ContactEmail string `json:"contactEmail" validate:"required,email,max=100"`
	Website      string `json:"website,required,max=100"`
}

func (dto *OrganizationCreate) ToModel(userID uint) *models.Organization {
	return &models.Organization{
		LegalName:    dto.LegalName,
		INN:          dto.INN,
		OGRN:         dto.OGRN,
		ContactEmail: dto.ContactEmail,
		Website:      dto.Website,
		OwnerID:      userID,
		Status:       0,
	}
}
