package models

import "gorm.io/gorm"

type Chat struct {
	gorm.Model
	HackathonID uint       `json:"hackathon_id"`
	Hackathon   *Hackathon `gorm:"foreignKey:HackathonID" json:"hackathon,omitempty"`
	TeamID      *uint      `json:"team_id"`
	Team        *Team      `gorm:"foreignKey:TeamID" json:"team,omitempty"`
	Type        int        `json:"type"`

	Messages []ChatMessage `gorm:"foreignKey:ChatID" json:"messages,omitempty"`
}
