package organizationDTO

import "server/models"

type OrganizationCreateDTO struct {
	LegalName    string `json:"legalName" validate:"required"`
	INN          string `json:"INN" validate:"required,len=12"`
	OGRN         string `json:"OGRN,required,len=13"`
	ContactEmail string `json:"contactEmail" validate:"required,email"`
	Website      string `json:"website,required"`
}

func (dto *OrganizationCreateDTO) ToModel(userID uint) *models.Organization {
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
