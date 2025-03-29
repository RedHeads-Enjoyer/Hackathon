package controllers

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"os"
	"server/initializers"
	"server/types"
	"time"
)

var (
	AccessTokenExpire  = getDurationEnv("ACCESS_TOKEN_EXPIRE", 15*time.Minute)
	RefreshTokenExpire = getDurationEnv("REFRESH_TOKEN_EXPIRE", 24*7*time.Hour)
	AccessTokenSecret  = getRequiredEnv("ACCESS_TOKEN_SECRET")
	RefreshTokenSecret = getRequiredEnv("REFRESH_TOKEN_SECRET")
)

// Вспомогательные функции для обработки переменных окружения
func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value, err := time.ParseDuration(os.Getenv(key)); err == nil {
		return value
	}
	return defaultValue
}

func getRequiredEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic("Environment variable " + key + " is required")
	}
	return value
}

func GenerateTokens(userID uint, email string) (string, string, error) {
	// Access Token
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, &types.Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: &jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(AccessTokenExpire)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.NewString(),
		},
	}).SignedString([]byte(AccessTokenSecret))

	if err != nil {
		return "", "", err
	}

	// Refresh Token
	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, &types.Claims{
		UserID: userID,
		RegisteredClaims: &jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(RefreshTokenExpire)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.NewString(),
		},
	}).SignedString([]byte(RefreshTokenSecret))

	return accessToken, refreshToken, err
}

// Вспомогательные функции
func getRefreshToken(c *gin.Context) (string, error) {
	if refreshToken, err := c.Cookie("refresh_token"); err == nil {
		return refreshToken, nil
	}

	var req struct{ RefreshToken string }
	if err := c.ShouldBindJSON(&req); err != nil || req.RefreshToken == "" {
		return "", errors.New("refresh token required")
	}
	return req.RefreshToken, nil
}

func validateRefreshToken(tokenString string) (*types.Claims, error) {
	claims := &types.Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(RefreshTokenSecret), nil
	})

	if err != nil || !token.Valid || isTokenBlacklisted(claims.ID) {
		return nil, errors.New("invalid refresh token")
	}

	return claims, nil
}

func SetRefreshTokenCookie(c *gin.Context, token string) {
	c.SetCookie(
		"refresh_token",
		token,
		int(RefreshTokenExpire.Seconds()),
		"/",
		"",   // Домен (можно указать ваш)
		true, // Secure (HTTPS only)
		true, // HttpOnly
	)
}

func ClearRefreshTokenCookie(c *gin.Context) {
	c.SetCookie(
		"refresh_token",
		"",
		-1,
		"/",
		"",
		true,
		true,
	)
}

func InvalidateToken(tokenID string, expiresAt time.Time) error {
	ctx := context.Background()
	return initializers.Cache.Set(ctx, "blacklist:"+tokenID, "1", time.Until(expiresAt)).Err()
}

func isTokenBlacklisted(tokenID string) bool {
	ctx := context.Background()
	exists, err := initializers.Cache.Exists(ctx, "blacklist:"+tokenID).Result()
	return err == nil && exists > 0
}
