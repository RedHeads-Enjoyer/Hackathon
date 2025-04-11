package models

type HackathonRole struct {
	Base
	Name        string `gorm:"size:50;unique;not null" json:"name"`
	Description string `gorm:"size:255" json:"description"`
	Level       uint   `gorm:"default:0" json:"level"`
}
