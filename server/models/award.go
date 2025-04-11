package models

type Award struct {
	Base
	Name        string    `gorm:"size:100;not null" json:"name"`
	PlaceFrom   int       `gorm:"not null" json:"place_from"`
	PlaceTo     int       `gorm:"not null" json:"place_to"`
	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"hackathon"`
	Teams       []Team    `gorm:"many2many:team_awards;" json:"winners,omitempty"`
}
