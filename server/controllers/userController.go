package controllers

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/models/DTO"
	"strconv"
)

type UserController struct {
	DB             *gorm.DB
	FileController *FileController
}

func NewUserController(db *gorm.DB, fileController *FileController) *UserController {
	return &UserController{DB: db, FileController: fileController}
}
func (uc *UserController) GetAll(c *gin.Context) {
	var users []models.User
	// Предварительная загрузка связанных данных
	if err := uc.DB.Preload("SystemRole").Preload("Avatar").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении пользователей", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

// Update - Обработчик для обновления пользователя
func (uc *UserController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID пользователя"})
		return
	}
	ownerID := uint(id) // Преобразование в uint

	var dto DTO.UserUpdateDTO

	// Привязка JSON к DTO
	if err := c.ShouldBind(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
		return
	}

	// Валидация данных
	validate := validator.New()
	if err := validate.Struct(dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации", "details": err.Error()})
		return
	}

	var user models.User

	// Поиск пользователя по ID
	if err := uc.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении пользователя", "details": err.Error()})
		}
		return
	}

	// Обновляем данные пользователя
	user = dto.ToModel(user)

	// Проверяем, был ли загружен файл
	if file, err := c.FormFile("avatar"); err == nil {
		// Вызов метода для загрузки файла
		newFile, err := uc.FileController.UploadFile(c, file, ownerID, "user")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		// Обновляем поле профиля пользователя, если необходимо
		user.Avatar = newFile // Или URL, если вы хотите хранить URL
	}

	// Сохраняем обновленного пользователя в базе данных
	if err := uc.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении информации о пользователе"})
		return
	}

	c.JSON(http.StatusOK, user)
}
