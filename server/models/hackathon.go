package models

import (
	"gorm.io/gorm"
	"time"
)

type Hackathon struct {
	gorm.Model

	Name        string `gorm:"size:50;unique;not null" json:"name"`
	Description string `gorm:"size:255" json:"description"`

	RegDateFrom time.Time `json:"reg_date_from,omitempty"`
	RegDateTo   time.Time `json:"reg_date_to,omitempty"`
	StartDate   time.Time `json:"start_date,omitempty"`
	EndDate     time.Time `json:"end_date,omitempty"`

	MaxTeams    *int `json:"max_teams,omitempty"`
	MaxTeamSize int  `json:"max_team_size,omitempty"`
	MinTeamSize int  `json:"min_team_size,omitempty"`

	StatusID uint `gorm:"not null;default:1" json:"-"`
	Status   int  `gorm:"not null" json:"status"`

	OrganizationID uint         `gorm:"not null" json:"organization_id"`
	Organization   Organization `gorm:"foreignKey:OrganizationID" json:"organization"`

	Logo         *File              `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`
	Users        []BndUserHackathon `gorm:"foreignKey:HackathonID" json:"-"`
	Files        []*File            `gorm:"polymorphic:Owner;polymorphicValue:hackathon" json:"files,omitempty"`
	Teams        []*Team            `gorm:"foreignKey:HackathonID" json:"teams,omitempty"`
	Steps        []*HackathonStep   `gorm:"foreignKey:HackathonID" json:"steps,omitempty"`
	Technologies []*Technology      `gorm:"many2many:hackathon_technologies;" json:"technologies,omitempty"`
	Awards       []*Award           `gorm:"foreignKey:HackathonID" json:"awards,omitempty"`
	Criteria     []*Criteria        `gorm:"foreignKey:HackathonID" json:"criteria,omitempty"`
}
