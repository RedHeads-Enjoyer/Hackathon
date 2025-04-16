package controllers

import (
	"log"
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
		Email    string `json:"email"    binding:"required,email"`
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

	defaultRoleID := int(1)

	user := models.User{
		Email:      input.Email,
		Username:   input.Username,
		Password:   string(hashedPassword),
		SystemRole: defaultRoleID,
	}

	if err := ac.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания пользователя"})
		return
	}

	accessToken, refreshToken, err := GenerateTokens(user.ID, user.Email, user.SystemRole)
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверные данные"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверные данные"})
		return
	}

	accessToken, refreshToken, err := GenerateTokens(user.ID, user.Email, user.SystemRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации токена"})
		return
	}

	SetRefreshTokenCookie(c, refreshToken)

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"user": gin.H{
			"id":          user.ID,
			"username":    user.Username,
			"system_role": user.SystemRole,
		},
	})
}

// CurrentUserHandler возвращает данные текущего пользователя
func (ac *AuthController) CurrentUserHandler(c *gin.Context) {
	claims := c.MustGet("user_claims").(*types.Claims)

	user, err := models.GetUserByID(ac.DB, claims.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// LogoutHandler выполняет выход пользователя
func (ac *AuthController) LogoutHandler(c *gin.Context) {
	claims := c.MustGet("user_claims").(*types.Claims)
	log.Printf("User  %d is logging out, invalidating token %s", claims.UserID, claims.ID)

	if err := InvalidateToken(claims.ID, claims.ExpiresAt.Time); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Logout failed"})
		return
	}

	ClearRefreshTokenCookie(c)

	c.JSON(http.StatusOK, gin.H{"message": "Выход успешен"})
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

	newAccess, newRefresh, err := GenerateTokens(claims.UserID, claims.Username, claims.SystemRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при генерации токена"})
		return
	}

	SetRefreshTokenCookie(c, newRefresh)
	c.JSON(http.StatusOK, gin.H{"access_token": newAccess})
}
