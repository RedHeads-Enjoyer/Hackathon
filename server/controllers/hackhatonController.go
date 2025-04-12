package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/models/DTO"
)

type HackathonController struct {
	DB *gorm.DB
}

func NewHackathonController(db *gorm.DB) *HackathonController {
	return &HackathonController{DB: db}
}

func (hc *HackathonController) create(c *gin.Context) {
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

	// Обработка файлов
	for _, fileDTO := range dto.Files {
		file := models.File{
			Name:       fileDTO.Name,
			StoredName: fileDTO.StoredName,
			URL:        fileDTO.URL,
			Size:       fileDTO.Size,
			Type:       fileDTO.Type,
			OwnerType:  "hackathon",
		}
		hackathon.Files = append(hackathon.Files, file)
	}

	// Обработка шагов
	for _, stepDTO := range dto.Steps {
		step := models.HackathonStep{
			Name:        stepDTO.Name,
			Description: stepDTO.Description,
			StartDate:   stepDTO.StartDate,
			EndDate:     stepDTO.EndDate,
		}
		hackathon.Steps = append(hackathon.Steps, step)
	}

	// Обработка целей
	for _, goal := range dto.Goals {
		hackathon.Goals = append(hackathon.Goals, models.HackathonGoal{Description: goal})
	}

	// Обработка наград
	for _, awardDTO := range dto.Awards {
		award := models.Award{
			PlaceFrom:    awardDTO.PlaceFrom,
			PlaceTo:      awardDTO.PlaceTo,
			MoneyAmount:  awardDTO.MoneyAmount,
			Additionally: awardDTO.Additionally,
		}
		hackathon.Awards = append(hackathon.Awards, award)
	}

	// Обработка технологий
	for _, techID := range dto.Technologies {
		var tech models.Technology
		if err := hc.DB.First(&tech, techID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Технология не найдена", "techID": techID})
			return
		}
		hackathon.Technologies = append(hackathon.Technologies, tech)
	}

	// Обработка критериев
	for _, criteriaID := range dto.Criteria {
		var criteria models.Criteria
		if err := hc.DB.First(&criteria, criteriaID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Критерий не найден", "criteriaID": criteriaID})
			return
		}
		hackathon.Criteria = append(hackathon.Criteria, criteria)
	}

	// Сохранение хакатона в базе данных
	if err := hc.DB.Create(&hackathon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании хакатона", "details": err.Error()})
		return
	}
}
