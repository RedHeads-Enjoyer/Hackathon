package models

import (
	"time"
)

type Hackathon struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	Name              string    `gorm:"size:255;not null" json:"name"`
	Description       string    `gorm:"type:text;not null" json:"description"`
	CoverImage        string    `gorm:"size:512;not null" json:"cover_image"`
	RegistrationStart time.Time `gorm:"not null" json:"registration_start"`
	RegistrationEnd   time.Time `gorm:"not null" json:"registration_end"`
	HackathonStart    time.Time `gorm:"not null" json:"hackathon_start"`
	MinTeamSize       int       `gorm:"not null" json:"min_team_size"`
	MaxTeamSize       int       `gorm:"not null" json:"max_team_size"`

	CreatorID uint `gorm:"not null" json:"creator_id"`
	Creator   User `gorm:"foreignKey:CreatorID" json:"creator"`

	Teams        []Team       `json:"teams"`
	Participants []User       `gorm:"many2many:hackathon_participants;" json:"participants"`
	Stages       []Stage      `json:"stages"`
	Criteria     []Criterion  `json:"criteria"`
	Technologies []Technology `gorm:"many2many:hackathon_technologies;" json:"technologies"`
	Rewards      []Reward     `json:"rewards"`
	Sponsors     []Sponsor    `json:"sponsors"`

	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
	Status    HackathonStatus `gorm:"type:enum('draft','published','completed','canceled');default:'draft'" json:"status"`
}

type HackathonStatus string

const (
	Draft     HackathonStatus = "draft"
	Published HackathonStatus = "published"
	Completed HackathonStatus = "completed"
	Canceled  HackathonStatus = "canceled"
)
