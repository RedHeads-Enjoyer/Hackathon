package models

import "time"

type BndUserHackathon struct {
	UserID        uint `gorm:"primaryKey" json:"user_id"`
	HackathonID   uint `gorm:"primaryKey" json:"hackathon_id"`
	HackathonRole int  `gorm:"not null"`

	User      User      `gorm:"foreignKey:UserID" json:"-"`
	Hackathon Hackathon `gorm:"foreignKey:HackathonID" json:"-"`

	CreatedAt time.Time `gorm:"autoCreateTime"`
}
