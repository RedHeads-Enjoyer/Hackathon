package models

import "gorm.io/gorm"

type Score struct {
	gorm.Model
	TeamID     uint    `gorm:"not null" json:"team_id"`
	CriteriaID uint    `gorm:"not null" json:"criteria_id"`
	Score      float64 `gorm:"not null" json:"score"`
	Comment    string  `gorm:"type:text" json:"comment"`

	Team     Team     `gorm:"foreignKey:TeamID"`
	Criteria Criteria `gorm:"foreignKey:CriteriaID"`
}
