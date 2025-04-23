package controllers

import (
	"errors"
	"fmt"
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
	var dto organizationDTO.OrganizationCreateDTO

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
	var organizations []models.Organization

	if err := oc.DB.Find(&organizations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организаций", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, organizations)
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

func (oc *OrganizationController) SetVerified(c *gin.Context) {
	id := c.Param("id")
	var organization models.Organization

	// Поиск организации по ID
	if err := oc.DB.First(&organization, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организации", "details": err.Error()})
		return
	}

	// Получение значения isVerified из тела запроса
	var requestBody struct {
		status int `json:"status"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат запроса", "details": err.Error()})
		return
	}

	// Установка значения isVerified
	organization.Status = 1

	fmt.Println(organization)

	// Сохранение обновленной организации в базе данных
	if err := oc.DB.Save(&organization).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении статуса верификации", "details": err.Error()})
		return
	}

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

	// Получение идентификатора пользователя
	userID := claims.UserID

	// Поиск организаций, связанных с пользователем
	var organizations []models.Organization
	if err := oc.DB.Where("owner_id = ?", userID).Find(&organizations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении организаций"})
		c.Abort()
		return
	}

	// Возврат списка организаций
	c.JSON(http.StatusOK, organizations)
}
