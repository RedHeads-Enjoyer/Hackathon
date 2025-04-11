package models

type Hackathon struct {
	Base

	Files []File `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`
	Logo  *File  `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`

	Users []BndUserHackathon `gorm:"foreignKey:HackathonID" json:"-"`
	Teams []Team             `gorm:"foreignKey:HackathonID" json:"teams,omitempty"`
	Steps []HackathonStep    `gorm:"foreignKey:HackathonID" json:"steps,omitempty"`
}

type HackathonStep struct {
	Base

	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"-"`
}
