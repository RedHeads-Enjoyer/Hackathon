package models

import "time"

type Stage struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	HackathonID uint      `gorm:"not null" json:"hackathon_id"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	Description string    `gorm:"type:text;not null" json:"description"`
	StartDate   time.Time `gorm:"not null" json:"start_date"`
	EndDate     time.Time `gorm:"not null" json:"end_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
