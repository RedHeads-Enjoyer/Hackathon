package models

import "time"

type Hackathon struct {
	Base

	RegDateFrom time.Time `json:"reg_date_from,omitempty"`
	RegDateTo   time.Time `json:"reg_date_to,omitempty"`
	StartDate   time.Time `json:"start_date,omitempty"`

	MaxTeams    int `json:"max_teams,omitempty"`
	MaxTeamSize int `json:"max_team_size,omitempty"`
	MinTeamSize int `json:"min_team_size,omitempty"`

	StatusID uint            `gorm:"not null;default:1" json:"-"`
	Status   HackathonStatus `gorm:"foreignKey:StatusID" json:"status"`

	PrizeTerms *File `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`

	Files []File `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`
	Logo  *File  `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`

	Users        []BndUserHackathon  `gorm:"foreignKey:HackathonID" json:"-"`
	Teams        []Team              `gorm:"foreignKey:HackathonID" json:"teams,omitempty"`
	Steps        []HackathonStep     `gorm:"foreignKey:HackathonID" json:"steps,omitempty"`
	Goals        []HackathonStep     `gorm:"foreignKey:HackathonID" json:"goals,omitempty"`
	Sponsors     []HackathonSponsors `gorm:"foreignKey:HackathonID" json:"sponsors,omitempty"`
	Technologies []Technology        `gorm:"many2many:hackathon_technologies;" json:"technologies,omitempty"`
	Awards       []Award             `gorm:"foreignKey:HackathonID" json:"awards,omitempty"`
	Criteria     []Criteria          `gorm:"many2many:hackathon_criteria;" json:"criteria,omitempty"`
}

type HackathonStep struct {
	Base

	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"-"`
}

type HackathonGoal struct {
	Base

	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"-"`
}

type HackathonSponsors struct {
	Base

	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"-"`
}

type HackathonStatus struct {
	Base
	Name        string      `gorm:"size:50;unique;not null" json:"name"`
	Description string      `gorm:"size:255" json:"description"`
	Hackathons  []Hackathon `gorm:"foreignKey:StatusID" json:"-"`
}
