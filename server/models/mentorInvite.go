package models

import "gorm.io/gorm"

type MentorInvite struct {
	gorm.Model

	User   User `gorm:"foreignKey:UserID" json:"user"`
	UserID uint `gorm:"not null" json:"judge_id"`

	HackathonID uint      `gorm:"foreignKey:HackathonID" json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"not null" json:"hackathon"`

	Status   int  `gorm:"not null" json:"status"`
	StatusId uint `gorm:"foreignKey:InviteStatusID" json:"status_id"`
}
