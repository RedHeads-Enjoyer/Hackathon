package models

type Organization struct {
	Base
	LegalName    string  `gorm:"unique;not null" json:"legal_name"`
	INN          string  `gorm:"size:12" json:"inn"`
	OGRN         *string `gorm:"size:15" json:"ogrn"`
	ContactEmail string  `gorm:"size:100" json:"contact_email"`
	Website      string  `gorm:"size:100" json:"website"`

	OwnerID uint `gorm:"not null" json:"owner_id"`
	Owner   User `gorm:"foreignKey:OwnerID" json:"owner"`

	Hackathons []Hackathon `gorm:"foreignKey:OrganizationID" json:"hackathons,omitempty"`

	IsVerified bool `gorm:"default:false" json:"-"`
}
