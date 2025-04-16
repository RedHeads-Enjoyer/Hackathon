package models

import "gorm.io/gorm"

type MentorInvite struct {
	gorm.Model

	User   User `gorm:"foreignKey:UserID" json:"-"`
	UserID uint `gorm:"not null" json:"user_id"`

	HackathonID uint      `gorm:"foreignKey:HackathonID" json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"not null" json:"-"`

	Status int `gorm:"not null" json:"status"`
}
