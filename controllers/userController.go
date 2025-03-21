package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"hackathon/initializers"
	"hackathon/models"
	"net/http"
)

func Signup(c *gin.Context) {
	// Получаем данные из запроса
	var user models.User
	var err error
	validate := validator.New()

	// Парсим JSON-запрос в структуру user
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Проверяем, что email и password не пустые
	err = validate.Struct(user)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"error": "Validation errors:" + err.Error()})
		return
	}

	query := `
		INSERT INTO users (email, password)
		VALUES ($1, $2)
	`

	_, err = initializers.DB.Exec(query, user.Email, user.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Возвращаем успешный ответ
	c.JSON(http.StatusOK, gin.H{"message": "User created successfully"})
}
