package models

import (
	"errors"
	"time"
)

type Hackathon struct {
	Base

	Name        string `gorm:"size:50;unique;not null" json:"name"`
	Description string `gorm:"size:255" json:"description"`

	RegDateFrom time.Time `json:"reg_date_from,omitempty"`
	RegDateTo   time.Time `json:"reg_date_to,omitempty"`
	StartDate   time.Time `json:"start_date,omitempty"`
	EndDate     time.Time `json:"end_date,omitempty"`

	MaxTeams    *int `json:"max_teams,omitempty"`
	MaxTeamSize int  `json:"max_team_size,omitempty"`
	MinTeamSize int  `json:"min_team_size,omitempty"`

	StatusID uint            `gorm:"not null;default:1" json:"-"`
	Status   HackathonStatus `gorm:"foreignKey:StatusID" json:"status"`

	OrganizationID uint         `gorm:"not null" json:"organization_id"`
	Organization   Organization `gorm:"foreignKey:OrganizationID" json:"organization"`

	Logo         *File              `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`
	Users        []BndUserHackathon `gorm:"foreignKey:HackathonID" json:"-"`
	Files        []File             `gorm:"polymorphic:Owner;polymorphicValue:hackathon"`
	Teams        []Team             `gorm:"foreignKey:HackathonID" json:"teams,omitempty"`
	Steps        []HackathonStep    `gorm:"foreignKey:HackathonID" json:"steps,omitempty"`
	Goals        []HackathonGoal    `gorm:"foreignKey:HackathonID" json:"goals,omitempty"`
	Technologies []Technology       `gorm:"many2many:hackathon_technologies;" json:"technologies,omitempty"`
	Awards       []Award            `gorm:"foreignKey:HackathonID" json:"awards,omitempty"`
	Criteria     []Criteria         `gorm:"many2many:hackathon_criteria;" json:"criteria,omitempty"`
}

func (hackathon *Hackathon) Validate() error {
	if hackathon.RegDateFrom.After(hackathon.RegDateTo) {
		return errors.New("дата окончания регистрации должна быть позже даты начала регистрации")
	}

	if hackathon.StartDate.After(hackathon.EndDate) {
		return errors.New("дата окончания хакатона должна быть позже даты начала хакатона")
	}

	if hackathon.RegDateTo.After(hackathon.StartDate) {
		return errors.New("дата начала хакатона должна быть позже даты окончания регистрации")
	}

	if hackathon.MaxTeamSize < hackathon.MinTeamSize {
		return errors.New("максимальный размер команды должен быть больше минимального размера команды")
	}

	return nil
}
