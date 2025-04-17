package middlewares

import (
	"errors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/types"
	"strconv"
)

func HackathonParticipant(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Извлечение ID хакатона из URL
		hackathonIDStr := c.Param("hackathon_id")
		if hackathonIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
			c.Abort()
			return
		}

		// Преобразование ID хакатона из строки в uint
		hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный идентификатор хакатона"})
			c.Abort()
			return
		}

		// Извлечение ID пользователя из claims
		claims := c.MustGet("user_claims").(*types.Claims)
		userID := claims.UserID

		// Проверка, является ли пользователь участником хакатона
		var participant models.BndUserHackathon
		if err := db.Where("user_id = ? AND hackathon_id = ?", userID, hackathonID).First(&participant).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusForbidden, gin.H{"error": "Пользователь не является участником хакатона"})
				c.Abort()
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке участника", "details": err.Error()})
			c.Abort()
			return
		}

		c.Next()
	}
}
