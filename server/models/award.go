package models

import "gorm.io/gorm"

type Award struct {
	gorm.Model
	MoneyAmount  float64   `gorm:"default:0" json:"money_amount"`
	Additionally string    `gorm:"default:''" json:"additionally"`
	PlaceFrom    int       `gorm:"not null" json:"place_from"`
	PlaceTo      int       `gorm:"not null" json:"place_to"`
	HackathonID  uint      `json:"hackathon_id"`
	Hackathon    Hackathon `gorm:"foreignKey:HackathonID" json:"-"`
	Teams        []Team    `gorm:"many2many:team_awards;" json:"winners,omitempty"`
}
