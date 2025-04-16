package middlewares

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/models/DTO"
	"server/types"
	"strconv"
)

func OrganizationOwner(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var orgID uint
		var dto DTO.HackathonCreateDTO
		// Проверка метода запроса
		if c.Request.Method == http.MethodPost || c.Request.Method == http.MethodPut {

			// Привязка JSON к requestBody
			if err := c.ShouldBindJSON(&dto); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
				c.Abort()
				return
			}

			orgID = dto.OrganizationID
		} else {
			// Если метод не POST или PUT, можно извлечь orgID из параметров URL
			orgIDParam := c.Param("organization_id")
			if orgIDParam == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор организации"})
				c.Abort()
				return
			}

			var err error
			var orgID64 uint64
			orgID64, err = strconv.ParseUint(orgIDParam, 10, 32)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат идентификатора организации"})
				c.Abort()
				return
			}

			// Преобразование orgID64 в uint
			if orgID64 > uint64(^uint(0)) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Идентификатор организации слишком велик"})
				c.Abort()
				return
			}
			orgID = uint(orgID64)
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

		c.Set("hackathon_dto", dto)

		c.Next()
	}
}
