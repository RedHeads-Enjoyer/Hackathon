package models

type Award struct {
	Base
	MoneyAmount  float64   `gorm:"default:1.0" json:"money_amount"`
	Additionally string    `gorm:"default:1.0" json:"additionally"`
	PlaceFrom    int       `gorm:"not null" json:"place_from"`
	PlaceTo      int       `gorm:"not null" json:"place_to"`
	HackathonID  uint      `json:"hackathon_id"`
	Hackathon    Hackathon `gorm:"foreignKey:HackathonID" json:"-"`
	Teams        []Team    `gorm:"many2many:team_awards;" json:"winners,omitempty"`
}
