package models

import "time"

type BndUserHackathon struct {
	UserID      uint `gorm:"primaryKey" json:"user_id"`
	HackathonID uint `gorm:"primaryKey" json:"hackathon_id"`
	RoleID      uint `gorm:"not null"`

	Role      HackathonRole `gorm:"foreignKey:RoleID"`
	User      User          `gorm:"foreignKey:UserID" json:"-"`
	Hackathon Hackathon     `gorm:"foreignKey:HackathonID" json:"-"`

	CreatedAt time.Time `gorm:"autoCreateTime"`
	IsActive  bool      `gorm:"default:true"`
}
