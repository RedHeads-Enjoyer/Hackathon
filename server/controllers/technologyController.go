package controllers

import (
	"net/http"
	"server/models/DTO/technology"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"server/models"
)

type TechnologyController struct {
	DB *gorm.DB
}

func NewTechnologyController(db *gorm.DB) *TechnologyController {
	return &TechnologyController{DB: db}
}

// Создание технологии
func (tc *TechnologyController) Create(c *gin.Context) {
	var dto technology.TechnologyCreateDTO

	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
		return
	}

	validate := validator.New()
	if err := validate.Struct(dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации", "details": err.Error()})
		return
	}

	technology := dto.ToModel()

	if err := tc.DB.Create(&technology).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании технологии", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, technology)
}

// Получение всех технологий
func (tc *TechnologyController) GetAll(c *gin.Context) {
	var technologies []models.Technology
	if err := tc.DB.Find(&technologies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении технологий", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, technologies)
}

// Получение технологии по ID
func (tc *TechnologyController) GetByID(c *gin.Context) {
	id := c.Param("id")
	var technology models.Technology

	if err := tc.DB.First(&technology, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Технология не найдена"})
		return
	}

	c.JSON(http.StatusOK, technology)
}

// Обновление технологии
func (tc *TechnologyController) Update(c *gin.Context) {
	id := c.Param("id")
	var dto technology.TechnologyUpdateDTO

	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
		return
	}

	var technology models.Technology
	if err := tc.DB.First(&technology, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Технология не найдена"})
		return
	}

	// Обновление полей технологии
	technology = *dto.ToModel(&technology)

	if err := tc.DB.Save(&technology).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении технологии", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, technology)
}

// Удаление технологии
func (tc *TechnologyController) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := tc.DB.Delete(&models.Technology{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении технологии", "details": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
