package models

import "gorm.io/gorm"

type Team struct {
	gorm.Model

	Name string `gorm:"size:50;unique;not null" json:"name"`

	Project *File  `gorm:"polymorphic:Owner;polymorphicValue:team" json:"omitempty"`
	Users   []User `gorm:"many2many:user_team" json:"-"`

	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"hackathon"`
	Awards      []Award   `gorm:"many2many:team_awards;" json:"awards,omitempty"`
	Scores      []Score   `gorm:"foreignKey:TeamID" json:"scores,omitempty"`
}
