package models

import (
	"errors"
	"gorm.io/gorm"
	"strings"
)

type HackathonGoal struct {
	Base
	Description string `gorm:"size:255;not null" json:"description"`
	HackathonID uint   `json:"hackathon_id"`
}

func (g *HackathonGoal) Validate() error {
	if strings.TrimSpace(g.Description) == "" {
		return errors.New("описание цели не может быть пустым")
	}

	if len(g.Description) > 255 {
		return errors.New("описание цели слишком длинное (макс. 255 символов)")
	}

	return nil
}

func (g *HackathonGoal) BeforeCreate(tx *gorm.DB) error {
	return g.Validate()
}
