package models

type BndUserTeam struct {
	UserID   uint `gorm:"primaryKey" json:"user_id"`
	TeamID   uint `gorm:"primaryKey" json:"team_id"`
	TeamRole int  `gorm:"not null" json:"team_role"` // Поле для хранения роли пользователя в команде

	User User `gorm:"foreignKey:UserID" json:"user"`
	Team Team `gorm:"foreignKey:TeamID" json:"team"`
}
