package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"net/http"
	"server/models/DTO"
)

type HackathonController struct {
	DB *gorm.DB
}

func NewHackathonController(db *gorm.DB) *HackathonController {
	return &HackathonController{DB: db}
}

// Создание хакатона
func (hc *HackathonController) Create(c *gin.Context) {
	var dto DTO.HackathonCreateDTO

	// Привязка JSON к DTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
		return
	}

	// Валидация данных
	validate := validator.New()
	if err := validate.Struct(dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации", "details": err.Error()})
		return
	}

	// Преобразование DTO в модель
	hackathon := dto.ToModel()

	// Установка статуса по умолчанию (например, "Черновик")
	hackathon.StatusID = 1 // Предполагается, что статус с ID 1 - это "Черновик"

	// Сохранение хакатона в базе данных
	if err := hc.DB.Create(&hackathon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании хакатона", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, hackathon)
}
