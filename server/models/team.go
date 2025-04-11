package models

type Team struct {
	Base

	Name string `gorm:"size:50;unique;not null" json:"name"`

	Project *File         `gorm:"polymorphic:Owner;polymorphicValue:team" json:"omitempty"`
	Users   []BndUserTeam `gorm:"foreignKey:TeamID" json:"-"`

	HackathonID uint      `json:"hackathon_id"`
	Hackathon   Hackathon `gorm:"foreignKey:HackathonID" json:"hackathon"`
	Awards      []Award   `gorm:"many2many:team_awards;" json:"awards,omitempty"`
	Scores      []Score   `gorm:"foreignKey:TeamID" json:"scores,omitempty"`
}

type Score struct {
	Base
	TeamID     uint    `gorm:"not null" json:"team_id"`
	CriteriaID uint    `gorm:"not null" json:"criteria_id"`
	Score      float64 `gorm:"not null" json:"score"`
	Comment    string  `gorm:"type:text" json:"comment"`

	Team     Team     `gorm:"foreignKey:TeamID"`
	Criteria Criteria `gorm:"foreignKey:CriteriaID"`
	Judge    User     `gorm:"foreignKey:JudgeID"`
	JudgeID  uint     `gorm:"not null" json:"judge_id"`
}
