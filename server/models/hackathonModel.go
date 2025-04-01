package models

import (
	"time"
)

type Hackathon struct {
	ID                   uint      `gorm:"primaryKey;column:id"`
	OwnerID              uint      `gorm:"column:owner"`
	Name                 string    `gorm:"type:VARCHAR(200);column:name"`
	Description          string    `gorm:"type:TEXT;column:description"`
	Task                 string    `gorm:"type:TEXT;column:task"`
	StartDate            time.Time `gorm:"column:start_date"`
	EndDate              time.Time `gorm:"column:end_date"`
	Status               int       `gorm:"column:status"`
	MinTeamSize          int       `gorm:"column:min_team_size"`
	MaxTeamSize          int       `gorm:"column:max_team_size"`
	RegistrationDeadline time.Time `gorm:"column:registration_deadline"`
	UpdatedAt            time.Time `gorm:"autoUpdateTime;column:updated_at"`
	CreatedAt            time.Time `gorm:"autoCreateTime;column:created_at"`
}
