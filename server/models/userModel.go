package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email    string `gorm:"unique;not null" json:"email"`
	Username string `gorm:"unique;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`
	Role     string `gorm:"not null" json:"role"`

	Awards []Award `gorm:"many2many:user_awards;" json:"awards"`
}
