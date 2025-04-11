package models

type ChatMessage struct {
	Base
	Content  string `gorm:"type:text;not null" json:"content"`
	UserID   uint   `json:"user_id"`
	ChatID   uint   `json:"chat_id"`
	ParentID *uint  `json:"parent_id,omitempty"`
	IsEdited bool   `gorm:"default:false" json:"is_edited"`
	IsPinned bool   `gorm:"default:false" json:"is_pinned"`

	User   User         `gorm:"foreignKey:UserID"`
	Chat   Chat         `gorm:"foreignKey:ChatID"`
	Parent *ChatMessage `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
}
