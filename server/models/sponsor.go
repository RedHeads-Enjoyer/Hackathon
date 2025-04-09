package models

import "time"

type Sponsor struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	HackathonID uint      `gorm:"not null" json:"hackathon_id"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	URL         string    `gorm:"size:512;not null" json:"url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
