package models

import "time"

type Team struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	HackathonID uint      `gorm:"not null" json:"hackathon_id"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Members     []User    `gorm:"many2many:team_members;" json:"members"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
