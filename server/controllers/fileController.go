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
	"strings"
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

	// Проверка максимального размера файла (например, 10MB)
	const maxFileSize = 1 * 1024 * 1024 * 1024 // 10MB в байтах
	if file.Size > maxFileSize {
		return nil, errors.New("размер файла превышает допустимый предел")
	}

	// Создаем директорию если её нет
	if err := os.MkdirAll(fc.Config.StoragePath, os.ModePerm); err != nil {
		return nil, fmt.Errorf("ошибка создания директории: %w", err)
	}

	// Генерируем уникальное имя для файла
	fileExt := filepath.Ext(file.Filename)
	fileUUID := uuid.New().String()
	storedName := fileUUID + fileExt
	filePath := filepath.Join(fc.Config.StoragePath, storedName)

	// Сохраняем файл
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return nil, fmt.Errorf("ошибка сохранения файла: %w", err)
	}

	// Определяем тип файла более надежным способом
	var fileType string

	// Сначала пробуем получить из заголовка
	fileType = file.Header.Get("Content-Type")

	// Если тип не определен или generic, определяем его по расширению
	if fileType == "" || fileType == "application/octet-stream" {
		fileType = getFileTypeByExtension(fileExt)
	}

	// Если все еще не определен, пробуем определить по содержимому
	if fileType == "" || fileType == "application/octet-stream" {
		openedFile, err := file.Open()
		if err == nil {
			defer openedFile.Close()
			buffer := make([]byte, 512) // Используем первые 512 байт для определения типа
			if _, err := openedFile.Read(buffer); err == nil {
				fileType = http.DetectContentType(buffer)
			}
		}
	}

	// Создаем URL с учетом сервера и путей
	fileURL := fmt.Sprintf("%s/api/files/%s%s", fc.Config.StoragePath, fileUUID, fileExt)

	// Создаем запись о файле в БД
	fileRecord := models.File{
		Name:         file.Filename,
		StoredName:   storedName,
		URL:          fileURL,
		Size:         file.Size,
		Type:         fileType,
		OwnerType:    ownerType,
		OwnerID:      ownerID,
		UploadedByID: userID.(uint),
	}

	if err := fc.DB.Create(&fileRecord).Error; err != nil {
		// Удаляем файл при ошибке записи в БД
		os.Remove(filePath)
		return nil, fmt.Errorf("ошибка создания записи в БД: %w", err)
	}

	return &fileRecord, nil
}

// Функция для определения типа файла по расширению
func getFileTypeByExtension(ext string) string {
	switch strings.ToLower(ext) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".pdf":
		return "application/pdf"
	case ".doc":
		return "application/msword"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".xls":
		return "application/vnd.ms-excel"
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case ".zip":
		return "application/zip"
	case ".txt":
		return "text/plain"
	case ".mp4":
		return "video/mp4"
	case ".mp3":
		return "audio/mpeg"
	default:
		return "application/octet-stream"
	}
}
func (fc *FileController) GetFile(c *gin.Context) {
	fileUUID := c.Param("file_id")

	// Находим файл по UUID
	var file models.File
	if err := fc.DB.Where("id = ?", fileUUID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден"})
		return
	}

	// Проверяем права доступа (упрощенно)
	// В реальном приложении здесь должна быть более сложная логика проверки прав
	//userID, exists := c.Get("userID")
	//if !exists {
	//	c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима авторизация"})
	//	return
	//}
	//
	//hasAccess := false

	// Пользователь, загрузивший файл, всегда имеет доступ
	//if file.UploadedByID == userID.(uint) {
	//	hasAccess = true
	//} else {
	//	// Проверка прав в зависимости от типа владельца
	//	switch file.OwnerType {
	//	case "hackathon":
	//		var count int64
	//		fc.DB.Model(&models.BndUserHackathon{}).
	//			Where("user_id = ? AND hackathon_id = ?", userID, file.OwnerID).
	//			Count(&count)
	//		hasAccess = count > 0
	//	case "team":
	//		var count int64
	//		fc.DB.Model(&models.BndUserTeam{}).
	//			Where("user_id = ? AND team_id = ?", userID, file.OwnerID).
	//			Count(&count)
	//		hasAccess = count > 0
	//	case "user":
	//		hasAccess = file.OwnerID == userID.(uint)
	//	}
	//}
	//
	//if !hasAccess {
	//	c.JSON(http.StatusForbidden, gin.H{"error": "Нет доступа к файлу"})
	//	return
	//}

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
