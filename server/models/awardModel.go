package models

import (
	"time"
)

type Award struct {
	ID          uint      `gorm:"primaryKey;column:id"`
	Name        string    `gorm:"type:VARCHAR(200);column:name"`
	Description string    `gorm:"type:VARCHAR(200);column:description"`
	UpdatedAt   time.Time `gorm:"column:updated_at"`
	CreatedAt   time.Time `gorm:"autoCreateTime;column:created_at"`
}
