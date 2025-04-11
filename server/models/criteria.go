package models

type Criteria struct {
	Base
	Name        string      `gorm:"size:100;not null" json:"name"`
	Description *string     `gorm:"type:text" json:"description"`
	Weight      *float64    `gorm:"default:1.0" json:"weight"`
	MaxScore    float64     `gorm:"default:10.0" json:"max_score"`
	MinScore    float64     `gorm:"default:0.0" json:"min_score"`
	Hackathons  []Hackathon `gorm:"many2many:hackathon_criteria;" json:"hackathons,omitempty"`
}
