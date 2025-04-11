package models

type User struct {
	Base
	Email    string `gorm:"unique;not null" json:"email"`
	Username string `gorm:"unique;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`

	SystemRoleID uint       `gorm:"not null;default:0" json:"-"`
	SystemRole   SystemRole `gorm:"foreignKey:SystemRoleID" json:"system_role"`

	Avatar       *File              `gorm:"polymorphic:Owner;polymorphicValue:user"`
	Hackathons   []BndUserHackathon `gorm:"foreignKey:UserID" json:"-"`
	Teams        []BndUserTeam      `gorm:"foreignKey:UserID" json:"-"`
	Technologies []Technology       `gorm:"many2many:user_technologies;" json:"technologies,omitempty"`

	Chats    []BndUserChat `gorm:"foreignKey:UserID" json:"-"`
	Messages []ChatMessage `gorm:"foreignKey:UserID" json:"-"`
}
