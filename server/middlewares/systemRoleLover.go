package middlewares

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"server/types"
)

func SystemRoleLover(level int) gin.HandlerFunc {
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

		if claims.SystemRole > level {
			fmt.Println(claims.SystemRole)
			fmt.Println(level)
			c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет прав на выполнение этого действия"})
			c.Abort()
			return
		}

		c.Next()
	}
}
