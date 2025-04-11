package models

type Team struct {
	Base

	Project *File         `gorm:"polymorphic:Owner;polymorphicValue:team" json:"omitempty"`
	Users   []BndUserTeam `gorm:"foreignKey:TeamID" json:"-"`

	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"hackathon"`
}
