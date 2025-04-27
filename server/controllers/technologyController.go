package controllers

import (
	"net/http"
	"server/models/DTO/technologyDTO"

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
	var dto technologyDTO.Create

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
	// Парсинг параметров фильтрации из тела запроса
	var filterData technologyDTO.Filter
	if err := c.ShouldBindJSON(&filterData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат фильтров"})
		return
	}

	// Базовый запрос для получения данных
	dataQuery := tc.DB.Model(&models.Technology{})

	// Применение фильтров к запросу
	if filterData.Name != "" {
		dataQuery = dataQuery.Where("name LIKE ?", "%"+filterData.Name+"%")
	}
	if filterData.Status != 0 {
		dataQuery = dataQuery.Where("status = ?", filterData.Status)
	}

	// Подсчет общего количества записей
	var totalCount int64
	if err := dataQuery.Count(&totalCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при подсчете технологий", "details": err.Error()})
		return
	}

	// Применение пагинации
	if filterData.Limit > 0 {
		dataQuery = dataQuery.Limit(filterData.Limit)
	}
	if filterData.Offset > 0 {
		dataQuery = dataQuery.Offset(filterData.Offset)
	}

	var technologies []models.Technology
	if err := dataQuery.Find(&technologies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении технологий", "details": err.Error()})
		return
	}

	// Возвращаем данные с информацией о пагинации
	c.JSON(http.StatusOK, gin.H{
		"list":   technologies,
		"total":  totalCount,
		"limit":  filterData.Limit,
		"offset": filterData.Offset,
	})
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
//func (tc *TechnologyController) Update(c *gin.Context) {
//	id := c.Param("id")
//	var dto technology.TechnologyUpdateDTO
//
//	if err := c.ShouldBindJSON(&dto); err != nil {
//		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
//		return
//	}
//
//	var technology models.Technology
//	if err := tc.DB.First(&technology, id).Error; err != nil {
//		c.JSON(http.StatusNotFound, gin.H{"error": "Технология не найдена"})
//		return
//	}
//
//	// Обновление полей технологии
//	technology = *dto.ToModel(&technology)
//
//	if err := tc.DB.Save(&technology).Error; err != nil {
//		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении технологии", "details": err.Error()})
//		return
//	}
//
//	c.JSON(http.StatusOK, technology)
//}
//
//// Удаление технологии
//func (tc *TechnologyController) Delete(c *gin.Context) {
//	id := c.Param("id")
//
//	if err := tc.DB.Delete(&models.Technology{}, id).Error; err != nil {
//		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении технологии", "details": err.Error()})
//		return
//	}
//
//	c.JSON(http.StatusNoContent, nil)
//}
