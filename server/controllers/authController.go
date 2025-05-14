package controllers

import (
	"errors"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"log"
	"net/http"
	"server/models"
	"server/models/DTO/userDTO"
	"server/types"
)

type AuthController struct {
	DB *gorm.DB
}

func NewAuthController(db *gorm.DB) *AuthController {
	return &AuthController{DB: db}
}

// RegisterHandler регистрирует нового пользователя
func (ac *AuthController) RegisterHandler(c *gin.Context) {
	var registerDTO userDTO.Register

	if err := c.ShouldBindJSON(&registerDTO); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingUser models.User
	if err := ac.DB.Where("email = ? OR username = ?", registerDTO.Email, registerDTO.Username).
		First(&existingUser).Error; err == nil {

		var message string
		if existingUser.Email == registerDTO.Email {
			message = "Пользователь с таким email уже зарегистрирован"
		} else {
			message = "Этот с таким именем уже зарегистрирован"
		}

		c.JSON(http.StatusConflict, gin.H{
			"error": message,
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(registerDTO.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка хеширования пароля"})
		return
	}

	defaultRoleID := int(1)

	user := models.User{
		Email:      registerDTO.Email,
		Username:   registerDTO.Username,
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
	var loginDTO userDTO.Login

	if err := c.ShouldBindJSON(&loginDTO); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	result := ac.DB.Where("email = ?", loginDTO.Email).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// Более информативное сообщение об ошибке
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Пользователь с таким email не найден",
			})
			return
		}

		// Обработка других возможных ошибок
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при поиске пользователя",
		})
		return
	}

	// Проверка пароля с более подробной обработкой ошибок
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginDTO.Password)); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Неверный пароль",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Ошибка проверки пароля",
				"debug": err.Error(),
			})
		}
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
			"id":         user.ID,
			"username":   user.Username,
			"systemRole": user.SystemRole,
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

	verifyDTO := userDTO.Verify{
		ID:         user.ID,
		SystemRole: user.SystemRole,
		Username:   user.Username,
	}

	c.JSON(http.StatusOK, verifyDTO)
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

	userID := claims.UserID
	var user models.User
	if err := ac.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}

	// Генерация новых токенов с обновленными данными
	newAccess, newRefresh, err := GenerateTokens(user.ID, user.Username, user.SystemRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при генерации токена"})
		return
	}

	// Установка нового refresh-токена в cookie
	SetRefreshTokenCookie(c, newRefresh)
	c.JSON(http.StatusOK, gin.H{"access_token": newAccess})
}
