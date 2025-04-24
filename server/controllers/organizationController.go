package controllers

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/models/DTO/organizationDTO"
	"server/types"
)

type OrganizationController struct {
	DB *gorm.DB
}

func NewOrganizationController(db *gorm.DB) *OrganizationController {
	return &OrganizationController{DB: db}
}

// Create - Создание новой организации
func (oc *OrganizationController) Create(c *gin.Context) {
	var dto organizationDTO.OrganizationCreate

	// Привязка JSON к DTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
		return
	}

	// Валидация данных1
	validate := validator.New()
	if err := validate.Struct(dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации", "details": err.Error()})
		return
	}

	var existingOrganization models.Organization
	err := oc.DB.Where("\"legalName\" = ? OR \"INN\" = ? OR \"OGRN\" = ?", dto.LegalName, dto.INN, dto.OGRN).First(&existingOrganization).Error
	if err == nil {
		// Если запись найдена, возвращаем соответствующее сообщение
		if existingOrganization.LegalName == dto.LegalName {
			c.JSON(http.StatusConflict, gin.H{"error": "Организация с таким полным названием уже зарегистрирована"})
			return
		}
		if existingOrganization.INN == dto.INN {
			c.JSON(http.StatusConflict, gin.H{"error": "Организация с таким ИНН уже зарегистрирована"})
			return
		}
		if existingOrganization.OGRN == dto.OGRN {
			c.JSON(http.StatusConflict, gin.H{"error": "Организация с таким ОГРН уже зарегистрирована"})
			return
		}
	}

	claims := c.MustGet("user_claims").(*types.Claims)

	// Преобразование DTO в модель
	org := dto.ToModel(claims.UserID)

	// Сохранение организации в базе данных
	if err := oc.DB.Create(&org).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании организации", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, org)
}

func (oc *OrganizationController) GetAllFull(c *gin.Context) {
	var organizations []models.Organization

	if err := oc.DB.Preload("Owner").Preload("Hackathons").Find(&organizations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организаций", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, organizations)
}

func (oc *OrganizationController) GetAll(c *gin.Context) {
	// Парсинг параметров фильтрации из тела запроса
	var filterData organizationDTO.OrganizationFilterData
	if err := c.ShouldBindJSON(&filterData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат фильтров"})
		return
	}

	// Базовый запрос для получения данных
	dataQuery := oc.DB.Model(&models.Organization{})

	// Применение фильтров к запросу
	applyFilters := func(query *gorm.DB) *gorm.DB {
		if filterData.LegalName != "" {
			query = query.Where("legal_name LIKE ?", "%"+filterData.LegalName+"%")
		}
		if filterData.INN != "" {
			query = query.Where("inn = ?", filterData.INN)
		}
		if filterData.OGRN != "" {
			query = query.Where("ogrn = ?", filterData.OGRN)
		}
		if filterData.ContactEmail != "" {
			query = query.Where("contact_email LIKE ?", "%"+filterData.ContactEmail+"%")
		}
		if filterData.Website != "" {
			query = query.Where("website LIKE ?", "%"+filterData.Website+"%")
		}
		if filterData.Status != 0 {
			query = query.Where("status = ?", filterData.Status)
		}
		return query
	}

	dataQuery = applyFilters(dataQuery)

	// Подсчет общего количества записей
	var totalCount int64
	if err := dataQuery.Count(&totalCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при подсчете организаций", "details": err.Error()})
		return
	}

	// Применение пагинации
	if filterData.Limit > 0 {
		dataQuery = dataQuery.Limit(filterData.Limit)
	}
	if filterData.Offset > 0 {
		dataQuery = dataQuery.Offset(filterData.Offset)
	}

	var organizations []models.Organization
	if err := dataQuery.Find(&organizations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организаций", "details": err.Error()})
		return
	}

	// Возвращаем данные с информацией о пагинации
	c.JSON(http.StatusOK, gin.H{
		"list":   organizations,
		"total":  totalCount,
		"limit":  filterData.Limit,
		"offset": filterData.Offset,
	})
}

func (oc *OrganizationController) GetByIDFull(c *gin.Context) {
	id := c.Param("id")
	var organization models.Organization

	// Поиск организации по ID
	if err := oc.DB.Preload("Owner").Preload("Hackathons").First(&organization, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организации", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, organization)
}

func (oc *OrganizationController) GetByID(c *gin.Context) {
	id := c.Param("id")
	var organization models.Organization

	// Поиск организации по ID
	if err := oc.DB.First(&organization, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организации", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, organization)
}

func (oc *OrganizationController) Update(c *gin.Context) {
	id := c.Param("id")
	var dto organizationDTO.OrganizationUpdateDTO

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

	var organization models.Organization

	// Поиск организации по ID
	if err := oc.DB.First(&organization, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организации", "details": err.Error()})
		}
		return
	}

	// Преобразование DTO в модель
	organization = dto.ToModel(organization)

	// Сохранение обновленной организации в базе данных
	if err := oc.DB.Save(&organization).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении организации", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, organization)
}

func (oc *OrganizationController) Delete(c *gin.Context) {
	id := c.Param("id")
	var organization models.Organization

	// Поиск организации по ID
	if err := oc.DB.First(&organization, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организации", "details": err.Error()})
		}
		return
	}

	// Удаление организации из базы данных
	if err := oc.DB.Delete(&organization).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении организации", "details": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (oc *OrganizationController) SetStatus(c *gin.Context) {
	id := c.Param("id")
	var organization models.Organization

	// Поиск организации по ID
	if err := oc.DB.First(&organization, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организации"})
		return
	}

	// Получение статуса из тела запроса
	var requestBody struct {
		Status int `json:"status"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат запроса", "details": err.Error()})
		return
	}

	// Обновление статуса
	if err := oc.DB.Model(&organization).Update("status", requestBody.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении статуса", "details": err.Error()})
		return
	}

	// Обновляем объект организации
	organization.Status = requestBody.Status

	c.JSON(http.StatusOK, organization)
}

func (oc *OrganizationController) GetMy(c *gin.Context) {
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		c.Abort()
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		c.Abort()
		return
	}

	// Парсинг параметров фильтрации из тела запроса
	var filterData organizationDTO.OrganizationFilterData
	if err := c.ShouldBindJSON(&filterData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат фильтров"})
		return
	}

	// Базовый запрос для подсчета общего количества
	countQuery := oc.DB.Model(&models.Organization{}).Where("\"ownerId\" = ?", claims.UserID)

	// Базовый запрос для получения данных
	dataQuery := oc.DB.Where("\"ownerId\" = ?", claims.UserID)

	// Применение фильтров к обоим запросам
	applyFilters := func(query *gorm.DB) *gorm.DB {
		if filterData.LegalName != "" {
			query = query.Where("legal_name LIKE ?", "%"+filterData.LegalName+"%")
		}
		if filterData.INN != "" {
			query = query.Where("inn = ?", filterData.INN)
		}
		if filterData.OGRN != "" {
			query = query.Where("ogrn = ?", filterData.OGRN)
		}
		if filterData.ContactEmail != "" {
			query = query.Where("contact_email LIKE ?", "%"+filterData.ContactEmail+"%")
		}
		if filterData.Website != "" {
			query = query.Where("website LIKE ?", "%"+filterData.Website+"%")
		}
		if filterData.Status != 0 {
			query = query.Where("status = ?", filterData.Status)
		}
		return query
	}

	countQuery = applyFilters(countQuery)
	dataQuery = applyFilters(dataQuery)

	// Подсчет общего количества записей
	var totalCount int64
	if err := countQuery.Count(&totalCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при подсчете организаций"})
		return
	}

	// Применение пагинации только к запросу данных
	if filterData.Limit > 0 {
		dataQuery = dataQuery.Limit(filterData.Limit)
	}
	if filterData.Offset > 0 {
		dataQuery = dataQuery.Offset(filterData.Offset)
	}

	var organizations []models.Organization
	if err := dataQuery.Find(&organizations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организаций"})
		return
	}

	// Возвращаем данные с информацией о пагинации
	c.JSON(http.StatusOK, gin.H{
		"list":   organizations,
		"total":  totalCount,
		"limit":  filterData.Limit,
		"offset": filterData.Offset,
	})
}
