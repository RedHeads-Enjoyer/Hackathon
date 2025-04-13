package models

import (
	"errors"
	"gorm.io/gorm"
	"strings"
	"time"
)

type HackathonStep struct {
	Base

	Name        string    `json:"name"`
	Description string    `json:"description"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`

	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"-"`
}

func (s *HackathonStep) Validate() error {
	if strings.TrimSpace(s.Name) == "" {
		return errors.New("название этапа обязательно")
	}

	if s.StartDate.IsZero() || s.EndDate.IsZero() {
		return errors.New("даты начала и окончания этапа обязательны")
	}

	if s.StartDate.After(s.EndDate) {
		return errors.New("дата окончания этапа должна быть после даты начала")
	}

	return nil
}

func (s *HackathonStep) BeforeCreate(tx *gorm.DB) error {
	return s.Validate()
}
