package types

import "github.com/golang-jwt/jwt/v5"

type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	*jwt.RegisteredClaims
}

type UserHackathon struct {
	UserID      uint   `gorm:"primaryKey"`
	HackathonID uint   `gorm:"primaryKey"`
	Role        string `gorm:"size:20;not null;default:'participant'"` // "creator", "mentor", "participant"
}
