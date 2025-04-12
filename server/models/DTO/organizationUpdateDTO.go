package DTO

import "server/models"

type OrganizationUpdateDTO struct {
	LegalName    *string `json:"legal_name,omitempty"`
	INN          *string `json:"inn,omitempty"`
	OGRN         *string `json:"ogrn,omitempty"`
	ContactEmail *string `json:"contact_email,omitempty"`
	Website      *string `json:"website,omitempty"`
	OwnerID      *uint   `json:"owner_id,omitempty"`
}

func (dto *OrganizationUpdateDTO) ToModel(existingOrganization models.Organization) models.Organization {
	if dto.LegalName != nil {
		existingOrganization.LegalName = *dto.LegalName
	}
	if dto.INN != nil {
		existingOrganization.INN = *dto.INN
	}
	if dto.OGRN != nil {
		existingOrganization.OGRN = dto.OGRN
	}
	if dto.ContactEmail != nil {
		existingOrganization.ContactEmail = *dto.ContactEmail
	}
	if dto.Website != nil {
		existingOrganization.Website = *dto.Website
	}
	if dto.OwnerID != nil {
		existingOrganization.OwnerID = *dto.OwnerID
	}

	return existingOrganization
}
