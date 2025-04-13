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
	DB             *gorm.DB
	FileController *FileController
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

	// Сохранение хакатона в базе данных
	if err := hc.DB.Create(&hackathon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании хакатона", "details": err.Error()})
		return
	}

	// Создание критериев
	for _, criteria := range dto.Criteria {
		criteriaModel := criteria.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
		if err := hc.DB.Create(&criteriaModel).Error; err != nil {
			return
		}
	}

	// Создание шагов
	for _, step := range dto.Steps {
		stepModel := step.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
		if err := hc.DB.Create(&stepModel).Error; err != nil {
			return
		}
	}

	// Создание наград
	for _, award := range dto.Awards {
		awardModel := award.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
		if err := hc.DB.Create(&awardModel).Error; err != nil {
			return
		}
	}

	// Проверяем, были ли загружены файлы
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB limit
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка при парсинге формы", "details": err.Error()})
		return
	}

	files := c.MultipartForm.File["files"] // Получаем массив файлов по имени поля "files"
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Файлы не найдены"})
		return
	}

	for _, file := range files {
		newFile, err := hc.FileController.UploadFile(c, file, hackathon.ID, "hackathon")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Создание файлов
	for _, file := range dto.Files {
		fileModel := file.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
		if err := hc.DB.Create(&fileModel).Error; err != nil {
			return
		}
	}

	// Проверяем, был ли загружен файл
	if files, err := c.FormFile("files"); err == nil {
		for _, file := range files {
			newFile, err := hc.FileController.UploadFile(c, file, hackathon.ID, "hackathon")
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	c.JSON(http.StatusCreated, hackathon)
}

// GetAll - Получение списка всех хакатонов
func (hc *HackathonController) GetAll(c *gin.Context) {
	var hackathons []models.Hackathon

	if err := hc.DB.Find(&hackathons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении хакатонов", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hackathons)
}
