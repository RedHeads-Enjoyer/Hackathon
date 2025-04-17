package middlewares

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/types"
)

func Owner(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		orgId := c.Param("id")
		if orgId == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор организации"})
			c.Abort()
			return
		}

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

		var org models.Organization
		if err := db.First(&org, orgId).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Организация не найдена"})
			c.Abort()
			return
		}

		if org.OwnerID != claims.UserID && claims.SystemRole == 1 {
			c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет прав на выполнение этого действия"})
			c.Abort()
			return
		}

		c.Next()
	}
}
