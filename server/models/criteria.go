package models

import "gorm.io/gorm"

type Criteria struct {
	gorm.Model
	Name     string `gorm:"size:1000;not null" json:"name"`
	MaxScore uint   `gorm:"default:10" json:"max_score"`
	MinScore uint   `gorm:"default:0" json:"min_score"`

	HackathonID uint      `gorm:"not null" json:"-"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"-"`
}
