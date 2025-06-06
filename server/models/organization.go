package models

import "gorm.io/gorm"

type Organization struct {
	gorm.Model
	LegalName    string `gorm:"unique;not null" json:"legalName"`
	INN          string `gorm:"unique;size:12" json:"INN"`
	OGRN         string `gorm:"unique;size:15" json:"OGRN"`
	ContactEmail string `gorm:"size:100" json:"contactEmail"`
	Website      string `gorm:"size:100" json:"website"`
	Status       int    `gorm:"not null" json:"status"`

	OwnerID uint  `gorm:"column:ownerId;not null" json:"ownerId"`
	Owner   *User `gorm:"foreignKey:OwnerID" json:"owner"`

	Hackathons []Hackathon `gorm:"foreignKey:OrganizationID" json:"hackathons"`
}
