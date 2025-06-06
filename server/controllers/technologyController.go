package controllers

import (
	"errors"
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

	// Проверяем существование технологии с таким именем
	var existingTechnology models.Technology
	result := tc.DB.Where("name = ?", dto.Name).First(&existingTechnology)
	if result.Error == nil {
		// Технология с таким именем уже существует
		c.JSON(http.StatusConflict, gin.H{"error": "Технология с таким названием уже существует"})
		return
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Произошла ошибка при проверке
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке существования технологии", "details": result.Error.Error()})
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
	if err := dataQuery.Order("id ASC").Find(&technologies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении технологий", "details": err.Error()})
		return
	}

	// Преобразование моделей в DTO
	var technologiesDTO []technologyDTO.GetAll
	for _, tech := range technologies {
		techDTO := technologyDTO.GetAll{
			Id:          tech.ID,
			Name:        tech.Name,
			Description: tech.Description,
		}
		technologiesDTO = append(technologiesDTO, techDTO)
	}

	// Возвращаем данные с информацией о пагинации
	c.JSON(http.StatusOK, gin.H{
		"list":   technologiesDTO,
		"total":  totalCount,
		"limit":  filterData.Limit,
		"offset": filterData.Offset,
	})
}

func (tc *TechnologyController) Update(c *gin.Context) {
	id := c.Param("id")
	var dto technologyDTO.Update

	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
		return
	}

	var technology models.Technology
	if err := tc.DB.First(&technology, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Технология не найдена"})
		return
	}

	// Проверка существования технологии с таким именем только если имя передано
	if dto.Name != nil && *dto.Name != technology.Name {
		var existingTechnology models.Technology
		result := tc.DB.Where("name = ? AND id != ?", *dto.Name, id).First(&existingTechnology)
		if result.Error == nil {
			// Другая технология с таким именем уже существует
			c.JSON(http.StatusConflict, gin.H{"error": "Технология с таким названием уже существует"})
			return
		} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// Произошла ошибка при проверке
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке существования технологии", "details": result.Error.Error()})
			return
		}
	}

	// Обновление полей технологии
	technology = *dto.ToModel(&technology)

	if err := tc.DB.Save(&technology).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении технологии", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, technology)
}

// // Удаление технологии
func (tc *TechnologyController) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := tc.DB.Delete(&models.Technology{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении технологии", "details": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetOptions возвращает список технологий для компонента выбора с поиском
func (tc *TechnologyController) GetOptions(c *gin.Context) {
	// Parse search options from request body
	var searchOption technologyDTO.SearchOption
	if err := c.ShouldBindJSON(&searchOption); err != nil {
		searchOption.Name = ""
	}

	// Build query
	query := tc.DB.Model(&models.Technology{})

	// Apply case-insensitive search filter
	if searchOption.Name != "" {
		// Choose one of these approaches based on your database:

		// Option 1: For PostgreSQL
		query = query.Where("name ILIKE ?", "%"+searchOption.Name+"%")

		// Option 2: For MySQL/MariaDB/SQLite
		// query = query.Where("LOWER(name) LIKE LOWER(?)", "%"+searchOption.Name+"%")
	}

	// Execute the query
	var options []technologyDTO.GetOption
	if err := query.Select("id as value, name as label").
		Order("name ASC").
		Limit(10).
		Find(&options).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении списка технологий"})
		return
	}

	// Return the results
	c.JSON(http.StatusOK, options)
}
