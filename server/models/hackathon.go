package models

type Hackathon struct {
	Base

	Users []BndUserHackathon `gorm:"foreignKey:HackathonID" json:"users"`

	Files []File `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`
	Logo  *File  `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`
}
