package models

import "time"

type Reward struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	HackathonID uint      `gorm:"not null" json:"hackathon_id"`
	PlaceFrom   int       `gorm:"not null" json:"place_from"`
	PlaceTo     int       `gorm:"not null" json:"place_to"`
	Description string    `gorm:"type:text;not null" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
