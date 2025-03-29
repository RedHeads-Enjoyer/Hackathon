package controllers

import (
	"net/http"
	"server/models"
	"server/types"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthController struct {
	DB *gorm.DB
}

func NewAuthController(db *gorm.DB) *AuthController {
	return &AuthController{DB: db}
}

// RegisterHandler регистрирует нового пользователя
func (ac *AuthController) RegisterHandler(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingUser models.User
	if err := ac.DB.Where("email = ? OR username = ?", input.Email, input.Username).
		First(&existingUser).Error; err == nil {

		var message string
		if existingUser.Email == input.Email {
			message = "Пользователь с таким email уже зарегистрирован"
		} else {
			message = "Этот username уже занят"
		}

		c.JSON(http.StatusConflict, gin.H{
			"error": message,
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка хеширования пароля"})
		return
	}

	user := models.User{
		Email:    input.Email,
		Username: input.Username,
		Password: string(hashedPassword),
	}

	if err := ac.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания пользователя"})
		return
	}

	accessToken, refreshToken, err := GenerateTokens(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации токена"})
		return
	}

	SetRefreshTokenCookie(c, refreshToken)

	c.JSON(http.StatusCreated, gin.H{
		"access_token": accessToken,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
		},
	})
}

// LoginHandler аутентифицирует пользователя
func (ac *AuthController) LoginHandler(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := ac.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	accessToken, refreshToken, err := GenerateTokens(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	SetRefreshTokenCookie(c, refreshToken)

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
		},
	})
}

// CurrentUserHandler возвращает данные текущего пользователя
func (ac *AuthController) CurrentUserHandler(c *gin.Context) {
	claims := c.MustGet("user_claims").(*types.Claims)

	var user models.User
	if err := ac.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"email": user.Email,
	})
}

// LogoutHandler выполняет выход пользователя
func (ac *AuthController) LogoutHandler(c *gin.Context) {
	claims := c.MustGet("user_claims").(*types.Claims)

	if err := InvalidateToken(claims.ID, claims.ExpiresAt.Time); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Logout failed"})
		return
	}

	ClearRefreshTokenCookie(c)

	c.JSON(http.StatusOK, gin.H{"message": "Successfully logged out"})
}

func (ac *AuthController) RefreshTokenHandler(c *gin.Context) {
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

	SetRefreshTokenCookie(c, newRefresh)
	c.JSON(http.StatusOK, gin.H{"access_token": newAccess})
}
