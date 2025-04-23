package models

import "gorm.io/gorm"

type Organization struct {
	gorm.Model
	LegalName    string `gorm:"column:legalName;unique;not null" json:"legalName"`
	INN          string `gorm:"column:INN;unique;size:12" json:"INN"`
	OGRN         string `gorm:"column:OGRN;unique;size:13" json:"OGRN"`
	ContactEmail string `gorm:"column:contactEmail;size:100" json:"contactEmail"`
	Website      string `gorm:"column:website;size:100" json:"website"`
	Status       int    `gorm:"column:website;not null" json:"status"`

	OwnerID uint  `gorm:"column:ownerId;not null" json:"ownerId"`
	Owner   *User `gorm:"foreignKey:OwnerID" json:"owner"`

	Hackathons []Hackathon `gorm:"foreignKey:OrganizationID" json:"hackathons"`
}
