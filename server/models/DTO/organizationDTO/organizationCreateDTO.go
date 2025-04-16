package organizationDTO

import "server/models"

type OrganizationCreateDTO struct {
	LegalName    string  `json:"legal_name" validate:"required"`
	INN          string  `json:"inn" validate:"required,len=12"`
	OGRN         *string `json:"ogrn,omitempty"`
	ContactEmail string  `json:"contact_email" validate:"required,email"`
	Website      string  `json:"website,omitempty"`
}

func (dto *OrganizationCreateDTO) ToModel(userID uint) *models.Organization {
	return &models.Organization{
		LegalName:    dto.LegalName,
		INN:          dto.INN,
		OGRN:         dto.OGRN,
		ContactEmail: dto.ContactEmail,
		Website:      dto.Website,
		OwnerID:      userID,
		IsVerified:   false,
	}
}
