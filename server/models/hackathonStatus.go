package models

type HackathonStatus struct {
	Base
	Name        string      `gorm:"size:50;unique;not null" json:"name"`
	Description string      `gorm:"size:255" json:"description"`
	Hackathons  []Hackathon `gorm:"foreignKey:StatusID" json:"-"`
}
