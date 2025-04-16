package middlewares

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"server/types"
	"strconv"
)

func User() gin.HandlerFunc {
	return func(c *gin.Context) {
		ownerID := c.Param("id")
		if ownerID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор пользователя"})
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

		var ownerIDUint uint
		if parsedID, err := strconv.ParseUint(ownerID, 10, 32); err == nil {
			ownerIDUint = uint(parsedID)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный идентификатор пользователя"})
			c.Abort()
			return
		}

		if ownerIDUint != claims.UserID && claims.SystemRole == 1 {
			c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет прав на выполнение этого действия"})
			c.Abort()
			return
		}

		c.Next()
	}
}
