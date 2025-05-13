package middlewares

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"net/http"
	"os"
	"server/types"
	"strings"
)

func extractToken(c *gin.Context) (string, error) {
	// Сначала проверяем URL-параметр (для WebSocket)
	tokenFromURL := c.Query("token")
	if tokenFromURL != "" {
		return tokenFromURL, nil
	}

	// Затем проверяем HTTP заголовок (для обычных запросов)
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", errors.New("authorization required")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", errors.New("invalid authorization header format")
	}

	return parts[1], nil
}

// Функция проверки токена
func parseToken(tokenString string) (*types.Claims, error) {
	claims := &types.Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("ACCESS_TOKEN_SECRET")), nil
	})

	// Добавьте явную проверку валидности токена
	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("token is not valid")
	}

	return claims, nil
}

// Middleware аутентификации
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := extractToken(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		// Проверяем токен
		claims, err := parseToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// Добавляем данные пользователя в контекст
		c.Set("user_claims", claims)
		c.Next()
	}
}
