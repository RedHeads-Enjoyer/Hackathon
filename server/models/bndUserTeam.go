package models

import "time"

type BndUserTeam struct {
	UserID uint `gorm:"primaryKey"`
	TeamID uint `gorm:"primaryKey"` // Исправлено с TeamId на TeamID для консистентности
	RoleID uint `gorm:"not null"`

	User User     `gorm:"foreignKey:UserID"`
	Team Team     `gorm:"foreignKey:TeamID"`
	Role TeamRole `gorm:"foreignKey:RoleID"`

	// Дополнительные поля при необходимости
	JoinedAt time.Time `gorm:"autoCreateTime"`
	IsActive bool      `gorm:"default:true"`
}
