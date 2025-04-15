package models

import "gorm.io/gorm"

type Organization struct {
	gorm.Model
	LegalName    string  `gorm:"unique;not null" json:"legal_name"`
	INN          string  `gorm:"unique,size:12" json:"inn"`
	OGRN         *string `gorm:"unique,size:15" json:"ogrn"`
	ContactEmail string  `gorm:"size:100" json:"contact_email"`
	Website      string  `gorm:"size:100" json:"website"`

	OwnerID uint  `gorm:"not null" json:"owner_id"`
	Owner   *User `gorm:"foreignKey:OwnerID" json:"owner"`

	Hackathons []Hackathon `gorm:"foreignKey:OrganizationID" json:"hackathons"`

	IsVerified bool `gorm:"default:false" json:"is_verified"`
}
