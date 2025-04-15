package models

import "gorm.io/gorm"

type Chat struct {
	gorm.Model
	HackathonID uint       `json:"hackathon_id"` // Если чат привязан к хакатону
	Hackathon   *Hackathon `gorm:"foreignKey:HackathonID" json:"hackathon,omitempty"`
	TeamID      *uint      `json:"team_id"` // Если чат привязан к команде
	Team        *Team      `gorm:"foreignKey:TeamID" json:"team,omitempty"`

	Members  []User        `gorm:"many2many:user_chat" json:"members,omitempty"`
	Messages []ChatMessage `gorm:"foreignKey:ChatID" json:"messages,omitempty"`
}
