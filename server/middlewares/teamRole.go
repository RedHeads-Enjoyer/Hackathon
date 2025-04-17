package middlewares

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/types"
	"strconv"
)

func TeamRole(db *gorm.DB, level int) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.MustGet("user_claims").(*types.Claims).UserID
		teamIDStr := c.Param("team_id")

		if teamIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор команды"})
			c.Abort()
			return
		}

		teamID, err := strconv.ParseUint(teamIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный идентификатор команды"})
			c.Abort()
			return
		}

		var userTeam models.BndUserTeam
		// Проверка, состоит ли пользователь в команде и какая у него роль
		if err := db.Where("user_id = ? AND team_id = ?", userID, teamID).First(&userTeam).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusForbidden, gin.H{"error": "Пользователь не является участником команды"})
				c.Abort()
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке роли пользователя", "details": err.Error()})
			c.Abort()
			return
		}

		// Проверка роли
		if userTeam.TeamRole < level {
			c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав для доступа к этому ресурсу"})
			c.Abort()
			return
		}

		// Если все проверки пройдены, продолжаем выполнение следующего обработчика
		c.Next()
	}
}
