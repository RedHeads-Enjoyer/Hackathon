package models

import (
	"gorm.io/gorm"
	"time"
)

type Hackathon struct {
	gorm.Model

	Name        string `gorm:"size:500;unique;not null" json:"name"`
	Description string `json:"size:10000;description"`

	RegDateFrom  time.Time `json:"reg_date_from,omitempty"`
	RegDateTo    time.Time `json:"reg_date_to,omitempty"`
	WorkDateFrom time.Time `json:"work_date_from,omitempty"`
	WorkDateTo   time.Time `json:"work_date_to,omitempty"`
	EvalDateFrom time.Time `json:"eval_date_from,omitempty"`
	EvalDateTo   time.Time `json:"eval_date_to,omitempty"`

	OrganizationID uint          `gorm:"not null" json:"organization_id"`
	Organization   *Organization `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`

	Logo         *File              `gorm:"polymorphic:Owner;polymorphicValue:hackathon_logo"`
	Users        []BndUserHackathon `gorm:"foreignKey:HackathonID" json:"-"`
	Files        []*File            `gorm:"polymorphic:Owner;polymorphicValue:hackathon_file" json:"files,omitempty"`
	Teams        []*Team            `gorm:"foreignKey:HackathonID" json:"teams,omitempty"`
	Steps        []*HackathonStep   `gorm:"foreignKey:HackathonID" json:"steps,omitempty"`
	Technologies []*Technology      `gorm:"many2many:hackathon_technologies;" json:"technologies,omitempty"`
	Awards       []*Award           `gorm:"foreignKey:HackathonID" json:"awards,omitempty"`
	Criteria     []*Criteria        `gorm:"foreignKey:HackathonID" json:"criteria,omitempty"`
}

func (h *Hackathon) AfterCreate(tx *gorm.DB) error {
	generalChat := Chat{
		HackathonID: h.ID,
		Type:        1,
	}
	if err := tx.Create(&generalChat).Error; err != nil {
		return err
	}

	organizerChat := Chat{
		HackathonID: h.ID,
		Type:        2,
	}
	if err := tx.Create(&organizerChat).Error; err != nil {
		return err
	}

	return nil
}
