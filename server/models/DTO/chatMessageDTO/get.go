package chatMessageDTO

import (
	"server/models"
	"time"
)

type Get struct {
	ID          uint      `json:"id"`
	Content     string    `json:"content"`
	Username    string    `json:"username"`
	CreatedAt   time.Time `json:"createdAt"`
	UserID      uint      `json:"userId"`
	WriteAccess bool      `json:"writeAccess"`
}

func ConvertToMessageDTO(message models.ChatMessage) Get {
	username := ""
	if message.User.Username != "" {
		username = message.User.Username
	} else if message.User.Email != "" {
		username = message.User.Email
	}

	return Get{
		ID:        message.ID,
		Content:   message.Content,
		Username:  username,
		CreatedAt: message.CreatedAt,
		UserID:    message.UserID,
	}
}
