package middlewares

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/types"
)

func HackathonRoleGreater(db *gorm.DB, level int) gin.HandlerFunc {
	return func(c *gin.Context) {
		userClaims, exists := c.Get("user_claims")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
			c.Abort()
			return
		}

		claims, ok := userClaims.(*types.Claims)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
			c.Abort()
			return
		}

		hackathonID := c.Param("hackathon_id") // Получаем ID хакатона из параметров запроса

		var userHackathon models.BndUserHackathon
		// Проверяем, существует ли запись о пользователе в хакатоне
		if err := db.Where("user_id = ? AND hackathon_id = ?", claims.UserID, hackathonID).First(&userHackathon).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден в хакатоне"})
				c.Abort() // Прерываем выполнение следующего обработчика
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке пользователя"})
			c.Abort()
			return
		}

		if userHackathon.HackathonRole < level {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ваша роль не соответствует"})
			c.Abort()
			return
		}

		// Если пользователь найден, продолжаем выполнение следующего обработчика
		c.Next()
	}
}
