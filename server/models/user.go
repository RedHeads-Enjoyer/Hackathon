package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Email    string `gorm:"unique;not null" json:"email"`
	Username string `gorm:"unique;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`

	SystemRole int `gorm:"not null" json:"system_role"`

	Avatar       *File              `gorm:"polymorphic:Owner;polymorphicValue:user"`
	Hackathons   []BndUserHackathon `gorm:"foreignKey:UserID" json:"-"`
	Teams        []Team             `gorm:"many2many:user_team" json:"-"`
	Technologies []Technology       `gorm:"many2many:user_technologies;" json:"technologies,omitempty"`

	Chats    []Chat        `gorm:"many2many:user_chat" json:"-"`
	Messages []ChatMessage `gorm:"foreignKey:UserID" json:"-"`

	Organizations []Organization `gorm:"foreignKey:OwnerID" json:"organizations,omitempty"`
}

func GetUserByID(db *gorm.DB, id uint) (User, error) {
	var user User
	if err := db.First(&user, id).Error; err != nil {
		return user, err
	}
	return user, nil
}
