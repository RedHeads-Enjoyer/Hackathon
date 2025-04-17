package middlewares

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/models/DTO/hackathonDTO"
	"server/types"
)

func OrganizationOwnerBody(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var orgID uint
		var dto hackathonDTO.HackathonCreateDTO

		if err := c.ShouldBindJSON(&dto); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
			c.Abort()
			return
		}

		orgID = dto.OrganizationID

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

		fmt.Println(organization.OwnerID)
		fmt.Println(claims.UserID)

		if organization.OwnerID != claims.UserID && claims.SystemRole == 1 {
			c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет прав на выполнение этого действия"})
			c.Abort()
			return
		}

		c.Set("hackathon_dto", dto)

		c.Next()
	}
}
