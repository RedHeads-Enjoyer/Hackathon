package controllers

import (
	"github.com/gin-gonic/gin"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"gorm.io/gorm"
	"server/models"
)

type FileController struct {
	DB *gorm.DB
}

func NewFileController(db *gorm.DB) *FileController {
	return &FileController{DB: db}
}

// UploadFile - Метод для загрузки файла
func (fc *FileController) UploadFile(c *gin.Context, file *multipart.FileHeader, ownerID uint, ownerType string) (*models.File, error) {
	// Определяем путь для сохранения файла
	uploadDir := "/app/uploads" // Папка для загрузки файлов
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return nil, err
	}

	// Генерируем уникальное имя для файла
	storedName := time.Now().Format("20060102150405") + "_" + file.Filename
	filePath := filepath.Join(uploadDir, storedName)

	// Сохраняем файл на сервере
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return nil, err
	}

	// Создаем запись о файле в базе данных
	newFile := models.File{
		Name:         file.Filename,
		StoredName:   storedName,
		URL:          "http://localhost/uploads/" + storedName,
		Size:         file.Size,
		Type:         file.Header.Get("Content-Type"),
		OwnerType:    ownerType,
		OwnerID:      ownerID,
		UploadedByID: ownerID,
	}

	if err := fc.DB.Create(&newFile).Error; err != nil {
		return nil, err
	}

	return &newFile, nil
}
