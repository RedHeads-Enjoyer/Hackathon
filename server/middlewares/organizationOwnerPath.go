package middlewares

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/types"
	"strconv"
)

func OrganizationOwnerPath(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var orgID uint

		hackathonIDParam := c.Param("hackathon_id")
		if hackathonIDParam == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
			c.Abort()
			return
		}

		// Преобразование идентификатора хакатона в uint
		hackathonID, err := strconv.ParseUint(hackathonIDParam, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат идентификатора хакатона"})
			c.Abort()
			return
		}

		// Поиск хакатона в базе данных
		var hackathon models.Hackathon
		if err := db.First(&hackathon, hackathonID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
			c.Abort()
			return
		}
		orgID = hackathon.OrganizationID

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

		var organization models.Organization
		if err := db.First(&organization, orgID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
			c.Abort()
			return
		}

		if organization.OwnerID != claims.UserID && claims.SystemRole == 1 {
			c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет прав на выполнение этого действия"})
			c.Abort()
			return
		}

		c.Next()
	}
}
