package models

type Chat struct {
	Base
	HackathonID uint       `json:"hackathon_id"` // Если чат привязан к хакатону
	Hackathon   *Hackathon `gorm:"foreignKey:HackathonID" json:"hackathon,omitempty"`
	TeamID      *uint      `json:"team_id"` // Если чат привязан к команде
	Team        *Team      `gorm:"foreignKey:TeamID" json:"team,omitempty"`

	Members  []BndUserChat `gorm:"foreignKey:ChatID" json:"members,omitempty"`
	Messages []ChatMessage `gorm:"foreignKey:ChatID" json:"messages,omitempty"`
}
