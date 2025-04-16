package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/models/DTO"
)

type HackathonController struct {
	DB             *gorm.DB
	FileController *FileController
}

func NewHackathonController(db *gorm.DB) *HackathonController {
	return &HackathonController{DB: db}
}

// Создание хакатона
func (hc *HackathonController) Create(c *gin.Context) {
	var dto DTO.HackathonCreateDTO

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

	// Преобразование DTO в модель
	hackathon := dto.ToModel()

	tx := hc.DB.Begin()
	if err := tx.Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при начале транзакции"})
		return
	}

	// Сохранение хакатона в базе данных
	if err := hc.DB.Create(&hackathon).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании хакатона", "details": err.Error()})
		return
	}

	// Создание критериев
	for _, criteria := range dto.Criteria {
		criteriaModel := criteria.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
		if err := hc.DB.Create(&criteriaModel).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании критерия", "details": err.Error()})
			return
		}
		hackathon.Criteria = append(hackathon.Criteria, criteriaModel)
	}

	// Создание шагов
	for _, step := range dto.Steps {
		stepModel := step.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
		if err := hc.DB.Create(&stepModel).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании этапа", "details": err.Error()})
			return
		}

		hackathon.Steps = append(hackathon.Steps, stepModel)
	}

	// Создание наград
	for _, award := range dto.Awards {
		awardModel := award.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
		if err := hc.DB.Create(&awardModel).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании награды", "details": err.Error()})
			return
		}
		hackathon.Awards = append(hackathon.Awards, awardModel)
	}

	//if file, err := c.FormFile("logo"); err == nil {
	//	// Вызов метода для загрузки файла
	//	newFile, err := hc.FileController.UploadFile(c, file, hackathon.ID, "user")
	//	if err != nil {
	//		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	//		return
	//	}
	//	// Обновляем поле профиля пользователя, если необходимо
	//	hackathon.Logo = newFile // Или URL, если вы хотите хранить URL
	//}

	// Проверяем, были ли загружены файлы
	//if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB limit
	//	c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка при парсинге формы", "details": err.Error()})
	//	return
	//}
	//
	//files := c.Request.MultipartForm.File["files"] // Получаем массив файлов по имени поля "files"
	//if len(files) == 0 {
	//	c.JSON(http.StatusBadRequest, gin.H{"error": "Файлы не найдены"})
	//	return
	//}

	// Обработка каждого файла
	//for _, file := range files {
	//	newFile, err := hc.FileController.UploadFile(c, file, hackathon.ID, "hackathon")
	//	if err != nil {
	//		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	//		return
	//	}
	//	// Здесь вы можете сохранить информацию о загруженном файле в базу данных, если это необходимо
	//	// Например, добавьте его в массив файлов хакатона
	//	hackathon.Files = append(hackathon.Files, newFile) // Предполагается, что у вас есть поле Files в модели хакатона
	//}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при подтверждении транзакции"})
		return
	}

	c.JSON(http.StatusCreated, hackathon)
}

// GetAll - Получение списка всех хакатонов
func (hc *HackathonController) GetAll(c *gin.Context) {
	var hackathons []models.Hackathon

	if err := hc.DB.Find(&hackathons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении хакатонов", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hackathons)
}

func (hc *HackathonController) GetAllFull(c *gin.Context) {
	var hackathons []models.Hackathon

	if err := hc.DB.Preload("Logo").Preload("Users").Preload("Files").Preload("Teams").Preload("Steps").Preload("Technologies").Preload("Awards").Preload("Users").Preload("Steps").Preload("Criteria").Preload("Organization").Find(&hackathons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении хакатонов", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hackathons)
}

func (hc *HackathonController) Update(c *gin.Context) {
	id := c.Param("id")
	var dto DTO.HackathonUpdateDTO

	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
		return
	}

	var hackathon models.Hackathon
	if err := hc.DB.First(&hackathon, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Обновляем хакатон с помощью DTO
	hackathon = dto.ToModel(hackathon)

	if err := hc.DB.Save(&hackathon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении хакатона", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hackathon)
}

func (hc *HackathonController) GetByIDFull(c *gin.Context) {
	id := c.Param("id")
	var hackathon models.Hackathon

	if err := hc.DB.Preload("Logo").Preload("Users").Preload("Files").Preload("Teams").Preload("Steps").Preload("Technologies").Preload("Awards").Preload("Criteria").Preload("Organization").First(&hackathon, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	c.JSON(http.StatusOK, hackathon)
}

// Delete - Удаление хакатона по ID
func (hc *HackathonController) Delete(c *gin.Context) {
	id := c.Param("id")
	var hackathon models.Hackathon

	// Проверяем, существует ли хакатон
	if err := hc.DB.First(&hackathon, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Удаляем хакатон
	if err := hc.DB.Delete(&hackathon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении хакатона", "details": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil) // Возвращаем статус 204 No Content
}
