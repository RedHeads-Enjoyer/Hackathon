package models

import "gorm.io/gorm"

type Technology struct {
	gorm.Model
	Name        string `gorm:"size:50;unique;not null" json:"name"`
	Description string `gorm:"size:255" json:"description"`

	Users      []User      `gorm:"many2many:user_technologies;" json:"-"`
	Hackathons []Hackathon `gorm:"many2many:hackathon_technologies;" json:"-"`
}
