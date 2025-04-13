package controllers

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"net/http"
	"os"
	"path/filepath"
	"server/models"
	"server/models/DTO"
	"time"
)

type UserController struct {
	DB *gorm.DB
}

func NewUserController(db *gorm.DB) *UserController {
	return &UserController{DB: db}
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

// Update  - Обработчик для обновления пользователя
func (uc *UserController) Update(c *gin.Context) {
	id := c.Param("id")
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

	// Поиск организации по ID
	if err := uc.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении пользователя", "details": err.Error()})
		}
		return
	}

	user = dto.ToModel(user)

	// Проверяем, был ли загружен файл
	if file, err := c.FormFile("avatar"); err == nil {
		// Определяем путь для сохранения файла
		uploadDir := "/app/uploads" // Папка для загрузки файлов
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании директории"})
			return
		}

		// Генерируем уникальное имя для файла
		storedName := time.Now().Format("20060102150405") + "_" + file.Filename
		filePath := filepath.Join(uploadDir, storedName)

		// Сохраняем файл на сервере
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении файла"})
			return
		}

		// Создаем запись о файле в базе данных
		newFile := models.File{
			Name:         file.Filename,
			StoredName:   storedName,
			URL:          "http://localhost/uploads/" + storedName,
			Size:         file.Size,
			Type:         file.Header.Get("Content-Type"),
			UploadedByID: user.ID,
			OwnerType:    "user",
			OwnerID:      user.ID,
		}

		if err := uc.DB.Create(&newFile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении информации о файле"})
			return
		}

		// Обновляем поле профиля пользователя, если необходимо
		user.Avatar = &newFile // Или URL, если вы хотите хранить URL
	}

	// Сохраняем обновленного пользователя в базе данных
	if err := uc.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении информации о пользователе"})
		return
	}

	c.JSON(http.StatusOK, user)
}
