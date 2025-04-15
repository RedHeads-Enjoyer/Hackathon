package models

import "gorm.io/gorm"

type TeamInvite struct {
	gorm.Model

	User   User `gorm:"foreignKey:UserID" json:"user"`
	UserID uint `gorm:"not null" json:"judge_id"`

	TeamID uint `gorm:"not null" json:"team_id"`
	Team   Team `gorm:"foreignKey:TeamID" json:"team"`

	Status   int  `gorm:"not null" json:"status"`
	StatusId uint `gorm:"foreignKey:InviteStatusID" json:"status_id"`
}
