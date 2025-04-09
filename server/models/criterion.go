package models

import "time"

type Criterion struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	HackathonID uint      `gorm:"not null" json:"hackathon_id"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	MinScore    float32   `gorm:"not null" json:"min_score"`
	MaxScore    float32   `gorm:"not null" json:"max_score"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
