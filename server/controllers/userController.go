package controllers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/models/DTO/technologyDTO"
	"server/models/DTO/userDTO"
	"server/types"
)

type UserController struct {
	DB *gorm.DB
}

func NewUserController(db *gorm.DB) *UserController {
	return &UserController{DB: db}
}

// GetOptions возвращает список пользователей для компонента выбора с поиском
func (tc *UserController) GetOptions(c *gin.Context) {
	// Идентификатор текущего пользователя
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}

	userID := claims.UserID

	var searchOption userDTO.SearchOption
	if err := c.ShouldBindJSON(&searchOption); err != nil {
		searchOption.Name = ""
	}

	query := tc.DB.Model(&models.User{})

	if searchOption.Name != "" {
		query = query.Where("(email ILIKE ? OR username ILIKE ?) AND id != ?", "%"+searchOption.Name+"%", "%"+searchOption.Name+"%", userID)
	}

	// Execute the query
	var options []technologyDTO.GetOption
	if err := query.Select("id as value, username as label").
		Order("username ASC").
		Limit(10).
		Find(&options).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении списка пользователей"})
		return
	}

	// Return the results
	c.JSON(http.StatusOK, options)
}
