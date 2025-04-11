package models

type Award struct {
	Base

	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"hackathon"`
	Teams       []Team    `gorm:"many2many:team_awards;" json:"winners,omitempty"`
}
