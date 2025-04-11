package models

type Hackathon struct {
	Base

	Files []File `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`
	Logo  *File  `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`

	Users []BndUserHackathon `gorm:"foreignKey:HackathonID" json:"-"`
}
