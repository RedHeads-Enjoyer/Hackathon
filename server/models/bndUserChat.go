package models

import "time"

type BndUserChat struct {
	UserID   uint      `gorm:"primaryKey" json:"user_id"`
	ChatID   uint      `gorm:"primaryKey" json:"chat_id"`
	RoleID   uint      `json:"role_id"`
	JoinedAt time.Time `gorm:"autoCreateTime" json:"joined_at"`
	IsMuted  bool      `gorm:"default:false" json:"is_muted"`
	IsBanned bool      `gorm:"default:false" json:"is_banned"`

	User User     `gorm:"foreignKey:UserID"`
	Chat Chat     `gorm:"foreignKey:ChatID"`
	Role ChatRole `gorm:"foreignKey:RoleID"`
}
