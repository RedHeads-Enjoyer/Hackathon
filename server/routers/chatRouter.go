package routers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/controllers"
	"server/middlewares"
)

func ChatRouter(router *gin.Engine, db *gorm.DB) {
	chatController := controllers.NewChatController(db)

	// Защищенные маршруты
	protected := router.Group("")
	protected.Use(middlewares.Auth())
	{
		protected.GET("hackathon/:hackathon_id/chats", chatController.GetAvailableChats)
		protected.GET("chat/:chat_id/messages", chatController.GetChatMessages)
		protected.GET("chat/:chat_id", chatController.WebSocketHandler)
	}
}
