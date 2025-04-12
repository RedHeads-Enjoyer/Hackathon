package models

type Criteria struct {
	Base
	Name        string  `gorm:"size:100;not null" json:"name"`
	Description string  `gorm:"type:text" json:"description"`
	MaxScore    float64 `gorm:"default:10.0" json:"max_score"`
	MinScore    float64 `gorm:"default:0.0" json:"min_score"`

	HackathonID uint      `gorm:"not null" json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"hackathon"`
}
