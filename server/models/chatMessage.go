package models

import "gorm.io/gorm"

type ChatMessage struct {
	gorm.Model
	Content  string `gorm:"type:text;not null" json:"content"`
	UserID   uint   `json:"user_id"`
	ChatID   uint   `json:"chat_id"`
	IsEdited bool   `gorm:"default:false" json:"is_edited"`
	Files    []File `gorm:"polymorphic:Owner;polymorphicValue:chat_message" json:"files,omitempty"`

	User User `gorm:"foreignKey:UserID"`
	Chat Chat `gorm:"foreignKey:ChatID"`
}
