package models

import "gorm.io/gorm"

type Team struct {
	gorm.Model

	Name string `gorm:"size:50;not null" json:"name"`

	Project *File         `gorm:"polymorphic:Owner;polymorphicValue:team" json:"team_project,omitempty"`
	Users   []BndUserTeam `gorm:"foreignKey:TeamID" json:"users,omitempty"`

	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"-"`
	Awards      []Award   `gorm:"many2many:team_awards;" json:"awards,omitempty"`
	Scores      []Score   `gorm:"foreignKey:TeamID" json:"scores,omitempty"`
}

func (t *Team) AfterCreate(tx *gorm.DB) error {
	// Create team chat (type 3)
	teamChat := Chat{
		HackathonID: t.HackathonID,
		TeamID:      &t.ID,
		Type:        3,
	}
	if err := tx.Create(&teamChat).Error; err != nil {
		return err
	}

	return nil
}

func (t *Team) BeforeDelete(tx *gorm.DB) error {
	if err := tx.Where("team_id = ? AND type = 3", t.ID).Delete(&Chat{}).Error; err != nil {
		return err
	}

	return nil
}
