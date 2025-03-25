package controllers

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"net/http"
	"os"
	"server/initializers"
	"time"
)

var (
	AccessTokenExpire  = getDurationEnv("ACCESS_TOKEN_EXPIRE", 15*time.Minute)
	RefreshTokenExpire = getDurationEnv("REFRESH_TOKEN_EXPIRE", 24*7*time.Hour)
	AccessTokenSecret  = getRequiredEnv("ACCESS_TOKEN_SECRET")
	RefreshTokenSecret = getRequiredEnv("REFRESH_TOKEN_SECRET")
)

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

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

func GenerateTokens(userID, email string) (string, string, error) {
	// Access Token
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(AccessTokenExpire)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.NewString(),
		},
	}).SignedString([]byte(AccessTokenSecret))

	if err != nil {
		return "", "", err
	}

	// Refresh Token
	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(RefreshTokenExpire)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.NewString(),
		},
	}).SignedString([]byte(RefreshTokenSecret))

	return accessToken, refreshToken, err
}

func RefreshTokenHandler(c *gin.Context) {
	refreshToken, err := getRefreshToken(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims, err := validateRefreshToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	newAccess, newRefresh, err := GenerateTokens(claims.UserID, claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	setRefreshCookie(c, newRefresh)
	c.JSON(http.StatusOK, gin.H{"access_token": newAccess})
}

func LogoutHandler(c *gin.Context) {
	claims, ok := c.Get("user_claims")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	if err := invalidateToken(claims.(*Claims).ID, claims.(*Claims).ExpiresAt.Time); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	clearRefreshCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
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

func validateRefreshToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(RefreshTokenSecret), nil
	})

	if err != nil || !token.Valid || isTokenBlacklisted(claims.ID) {
		return nil, errors.New("invalid refresh token")
	}

	return claims, nil
}

func setRefreshCookie(c *gin.Context, token string) {
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

func clearRefreshCookie(c *gin.Context) {
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

func invalidateToken(tokenID string, expiresAt time.Time) error {
	ctx := context.Background()
	return initializers.Cache.Set(ctx, "blacklist:"+tokenID, "1", time.Until(expiresAt)).Err()
}

func isTokenBlacklisted(tokenID string) bool {
	ctx := context.Background()
	exists, err := initializers.Cache.Exists(ctx, "blacklist:"+tokenID).Result()
	return err == nil && exists > 0
}
