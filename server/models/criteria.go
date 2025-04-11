package models

type Criteria struct {
	Base

	Hackathons []Hackathon `gorm:"many2many:hackathon_criteria;" json:"hackathons,omitempty"`
}
