package controllers

import (
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"server/models"
)

type FileController struct {
	DB     *gorm.DB
	Config struct {
		StoragePath string // Путь к директории для хранения файлов
	}
}

func NewFileController(db *gorm.DB) *FileController {
	fc := &FileController{
		DB: db,
	}
	fc.Config.StoragePath = "uploads"

	return fc
}

// UploadFile - метод для безопасной загрузки файла
func (fc *FileController) UploadFile(c *gin.Context, file *multipart.FileHeader, ownerID uint, ownerType string) (*models.File, error) {
	// Получаем текущего пользователя
	userID, exists := c.Get("userID")
	if !exists {
		return nil, errors.New("требуется авторизация")
	}

	// Создаем директорию если её нет
	if err := os.MkdirAll(fc.Config.StoragePath, os.ModePerm); err != nil {
		return nil, err
	}

	// Генерируем уникальное имя для файла
	fileExt := filepath.Ext(file.Filename)
	fileUUID := uuid.New().String()
	storedName := fileUUID + fileExt
	filePath := filepath.Join(fc.Config.StoragePath, storedName)

	// Сохраняем файл
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return nil, err
	}

	// Создаем запись о файле в БД
	fileRecord := models.File{
		Name:         file.Filename,
		StoredName:   storedName,
		URL:          "/api/files/" + fileUUID,
		Size:         file.Size,
		Type:         file.Header.Get("Content-Type"),
		OwnerType:    ownerType,
		OwnerID:      ownerID,
		UploadedByID: userID.(uint),
	}

	if err := fc.DB.Create(&fileRecord).Error; err != nil {
		// Удаляем файл при ошибке записи в БД
		os.Remove(filePath)
		return nil, err
	}

	return &fileRecord, nil
}

func (fc *FileController) GetFile(c *gin.Context) {
	fileUUID := c.Param("id")

	// Находим файл по UUID
	var file models.File
	if err := fc.DB.Where("stored_name LIKE ?", fileUUID+"%").First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден"})
		return
	}

	// Проверяем права доступа (упрощенно)
	// В реальном приложении здесь должна быть более сложная логика проверки прав
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима авторизация"})
		return
	}

	hasAccess := false

	// Пользователь, загрузивший файл, всегда имеет доступ
	if file.UploadedByID == userID.(uint) {
		hasAccess = true
	} else {
		// Проверка прав в зависимости от типа владельца
		switch file.OwnerType {
		case "hackathon":
			var count int64
			fc.DB.Model(&models.BndUserHackathon{}).
				Where("user_id = ? AND hackathon_id = ?", userID, file.OwnerID).
				Count(&count)
			hasAccess = count > 0
		case "team":
			var count int64
			fc.DB.Model(&models.BndUserTeam{}).
				Where("user_id = ? AND team_id = ?", userID, file.OwnerID).
				Count(&count)
			hasAccess = count > 0
		case "user":
			hasAccess = file.OwnerID == userID.(uint)
		}
	}

	if !hasAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет доступа к файлу"})
		return
	}

	// Формируем путь к файлу
	filePath := filepath.Join(fc.Config.StoragePath, file.StoredName)

	// Проверяем существование файла
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Физический файл не найден"})
		return
	}

	// Устанавливаем заголовки для скачивания
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", file.Name))
	c.Header("Content-Type", file.Type)

	// Отправляем файл
	c.File(filePath)
}
