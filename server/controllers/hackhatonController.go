package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"log"
	"net/http"
	"server/models"
	"server/models/DTO/awardDTO"
	"server/models/DTO/criteriaDTO"
	"server/models/DTO/fileDTO"
	"server/models/DTO/hackathonDTO"
	"server/models/DTO/hackathonStepDTO"
	"server/models/DTO/mentorInviteDTO"
	"server/models/DTO/teamDTO"
	"server/models/DTO/technologyDTO"
	"server/models/DTO/userDTO"
	"server/types"
	"sort"
	"strconv"
	"time"
	_ "time"
)

type HackathonController struct {
	DB             *gorm.DB
	FileController *FileController
}

func NewHackathonController(db *gorm.DB, fileController *FileController) *HackathonController {
	return &HackathonController{
		DB:             db,
		FileController: fileController, // Убедитесь, что это не nil
	}
}

// Создание хакатона
// CreateHackathon - метод для создания хакатона
func (hc *HackathonController) CreateHackathon(c *gin.Context) {
	// Получаем claims пользователя из контекста, установленные middleware Auth()
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима авторизация"})
		return
	}

	// Приводим claims к нужному типу
	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}

	// Парсим multipart форму
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка при парсинге формы: " + err.Error()})
		return
	}

	// Получаем JSON данные из поля 'data'
	hackathonDataJSON := c.Request.FormValue("data")
	if hackathonDataJSON == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствуют данные хакатона (поле 'data')"})
		return
	}

	// Десериализуем JSON в нашу DTO структуру
	var dto hackathonDTO.CreateDTO
	if err := json.Unmarshal([]byte(hackathonDataJSON), &dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка при разборе JSON: " + err.Error()})
		return
	}

	// Валидируем DTO
	validate := validator.New()
	if err := validate.Struct(dto); err != nil {
		validationErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации", "details": err.Error()})
			return
		}

		// Преобразуем validator.ValidationErrors в понятный формат
		errorDetails := make([]map[string]interface{}, 0)
		for _, e := range validationErrors {
			errorDetails = append(errorDetails, map[string]interface{}{
				"field":   e.Field(),
				"tag":     e.Tag(),
				"value":   e.Value(),
				"param":   e.Param(),
				"message": fmt.Sprintf("Поле '%s' не прошло валидацию: %s", e.Field(), e.Tag()),
			})
		}

		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации", "details": errorDetails})
		return
	}

	// Проверка на существование хакатона с таким же именем
	var existingHackathon models.Hackathon
	result := hc.DB.Where("name = ?", dto.Name).First(&existingHackathon)
	if result.Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Хакатон с таким названием уже существует"})
		return
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке существующих хакатонов: " + result.Error.Error()})
		return
	}

	// Проверяем права на создание хакатона в этой организации
	var organization models.Organization
	if err := hc.DB.First(&organization, dto.OrganizationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
		return
	}

	// Проверяем, что пользователь является владельцем организации
	if organization.OwnerID != claims.UserID {
		// Дополнительно можно проверить, является ли пользователь администратором
		if claims.SystemRole != 3 { // Предполагаю, что 3 - это роль администратора
			c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав для создания хакатона в этой организации"})
			return
		}
	}

	// Создаем хакатон в транзакции
	var hackathon models.Hackathon
	err := hc.DB.Transaction(func(tx *gorm.DB) error {
		// Преобразуем DTO в модель
		hackathon = *dto.ToModel()

		// Создаем запись хакатона
		if err := tx.Create(&hackathon).Error; err != nil {
			return err
		}

		// Добавляем связь создателя хакатона как организатора
		userHackathon := models.BndUserHackathon{
			UserID:        claims.UserID,
			HackathonID:   hackathon.ID,
			HackathonRole: 3, // Роль организатора
		}

		if err := tx.Create(&userHackathon).Error; err != nil {
			return err
		}

		// Загружаем логотип хакатона, если он есть
		c.Set("userID", claims.UserID)
		logoFile, err := c.FormFile("logo")
		if err == nil && logoFile != nil {
			file, err := hc.FileController.UploadFile(c, logoFile, hackathon.ID, "hackathon_logo")
			if err != nil {
				return err
			}

			hackathon.Logo = file
			if err := tx.Save(&hackathon).Error; err != nil {
				return err
			}
		}

		// Для обычных файлов
		form, err := c.MultipartForm()
		if err == nil && form != nil && form.File["files"] != nil {
			for _, fileHeader := range form.File["files"] {
				file, err := hc.FileController.UploadFile(c, fileHeader, hackathon.ID, "hackathon_file")
				if err != nil {
					return err
				}

				if err := tx.Model(&hackathon).Association("Files").Append(file); err != nil {
					return err
				}
			}
		}

		// Добавляем технологии
		if len(dto.Technologies) > 0 {
			var technologies []models.Technology
			if err := tx.Where("id IN ?", dto.Technologies).Find(&technologies).Error; err != nil {
				return err
			}

			if err := tx.Model(&hackathon).Association("Technologies").Append(&technologies); err != nil {
				return err
			}
		}

		// Добавляем приглашения
		if len(dto.Mentors) > 0 {
			var mentorInvites []models.MentorInvite

			for _, mentorID := range dto.Mentors {
				invite := models.MentorInvite{
					UserID:      mentorID,
					HackathonID: hackathon.ID,
					Status:      0,
				}
				mentorInvites = append(mentorInvites, invite)
			}

			if err := tx.Create(&mentorInvites).Error; err != nil {
				return err
			}
		}

		// Создаем и связываем этапы хакатона
		if len(dto.Steps) > 0 {
			for _, stepDTO := range dto.Steps {
				step := models.HackathonStep{
					HackathonID: hackathon.ID,
					Name:        stepDTO.Name,
					Description: stepDTO.Description,
					StartDate:   stepDTO.StartDate,
					EndDate:     stepDTO.EndDate,
				}

				if err := tx.Create(&step).Error; err != nil {
					return err
				}
			}
		}

		// Создаем и связываем критерии оценки
		if len(dto.Criteria) > 0 {
			for _, criterionDTO := range dto.Criteria {
				criterion := models.Criteria{
					HackathonID: hackathon.ID,
					Name:        criterionDTO.Name,
					MinScore:    criterionDTO.MinScore,
					MaxScore:    criterionDTO.MaxScore,
				}

				if err := tx.Create(&criterion).Error; err != nil {
					return err
				}
			}
		}

		// Создаем и связываем награды
		if len(dto.Awards) > 0 {
			for _, awardDTO := range dto.Awards {
				award := models.Award{
					HackathonID:  hackathon.ID,
					PlaceFrom:    awardDTO.PlaceFrom,
					PlaceTo:      awardDTO.PlaceTo,
					MoneyAmount:  awardDTO.MoneyAmount,
					Additionally: awardDTO.Additionally,
				}

				if err := tx.Create(&award).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, hackathon.ID)
}

// GetAll - Получение списка всех хакатонов
func (hc *HackathonController) GetAll(c *gin.Context) {
	// Парсинг параметров фильтрации из тела запроса
	var filterData hackathonDTO.FilterData
	if err := c.ShouldBindJSON(&filterData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат фильтров"})
		return
	}

	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}
	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}
	userID := claims.UserID

	// Базовый запрос для подсчета общего количества
	// Добавляем фильтр по статусу = 1
	countQuery := hc.DB.Model(&models.Hackathon{})

	// Базовый запрос для получения данных с предзагрузкой связанных данных
	// Также фильтруем по статусу = 1
	dataQuery := hc.DB.Model(&models.Hackathon{}).
		Preload("Organization").
		Preload("Technologies").
		Preload("Awards").
		Preload("Logo")

	// Применение дополнительных фильтров к обоим запросам
	applyFilters := func(query *gorm.DB) *gorm.DB {
		if filterData.Name != "" {
			query = query.Where("hackathons.name LIKE ?", "%"+filterData.Name+"%")
		}

		if filterData.OrganizationId != 0 {
			query = query.Where("hackathons.organization_id = ?", filterData.OrganizationId)
		}

		if filterData.StartDate != "" {
			startDate, err := time.Parse("2006-01-02", filterData.StartDate)
			if err == nil {
				query = query.Where("hackathons.reg_date_to >= ? OR hackathons.work_date_to >= ? OR hackathons.eval_date_to >= ?",
					startDate, startDate, startDate)
			}
		}

		if filterData.EndDate != "" {
			endDate, err := time.Parse("2006-01-02", filterData.EndDate)
			if err == nil {
				query = query.Where("hackathons.reg_date_from <= ? OR hackathons.work_date_from <= ? OR hackathons.eval_date_from <= ?",
					endDate, endDate, endDate)
			}
		}

		if filterData.TotalAward > 0 {
			// Подзапрос для суммы наград
			query = query.Where("(SELECT SUM(money_amount) FROM awards WHERE hackathon_id = hackathons.id) >= ?", filterData.TotalAward)
		}

		if filterData.TechnologyId > 0 {
			// Для технологий используем связь многие-ко-многим
			query = query.Joins("JOIN hackathon_technologies ht ON ht.hackathon_id = hackathons.id").
				Where("ht.technology_id = ?", filterData.TechnologyId).
				Group("hackathons.id") // Группировка для избежания дубликатов
		}

		if userID > 0 && filterData.Role != 0 {
			switch filterData.Role {
			case -1: // Не участник
				query = query.Where("NOT EXISTS (SELECT 1 FROM bnd_user_hackathons WHERE user_id = ? AND hackathon_id = hackathons.id)", userID)
			case 1, 2, 3: // Конкретная роль (участник, ментор, организатор)
				query = query.Joins("JOIN bnd_user_hackathons buh ON buh.hackathon_id = hackathons.id").
					Where("buh.user_id = ? AND buh.hackathon_role = ?", userID, filterData.Role)
			}
		}

		return query

		return query
	}

	countQuery = applyFilters(countQuery)
	dataQuery = applyFilters(dataQuery)

	// Подсчет общего количества записей
	var totalCount int64
	if err := countQuery.Count(&totalCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при подсчете хакатонов", "details": err.Error()})
		return
	}

	// Применение пагинации
	if filterData.Limit > 0 {
		dataQuery = dataQuery.Limit(filterData.Limit)
	} else {
		dataQuery = dataQuery.Limit(20) // Значение по умолчанию
	}

	if filterData.Offset > 0 {
		dataQuery = dataQuery.Offset(filterData.Offset)
	}

	// Сортировка по дате создания
	dataQuery = dataQuery.Order("hackathons.created_at DESC")

	// Получаем хакатоны с предзагруженными связями
	var hackathons []models.Hackathon
	if err := dataQuery.Find(&hackathons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении хакатонов", "details": err.Error()})
		return
	}

	// Преобразуем в DTO с краткой информацией
	hackathonInfoList := make([]hackathonDTO.ShortInfo, 0, len(hackathons))

	for _, h := range hackathons {
		// Рассчитываем сумму наград
		var totalAward float64
		for _, award := range h.Awards {
			totalAward += award.MoneyAmount * float64(award.PlaceTo-award.PlaceFrom+1)
		}

		// Собираем названия технологий
		technologies := make([]string, 0, len(h.Technologies))
		for _, tech := range h.Technologies {
			technologies = append(technologies, tech.Name)
		}

		// Определяем URL логотипа
		var logoId uint
		if h.Logo != nil {
			logoId = h.Logo.ID
		}

		// Подсчет пользователей с ролью 1 в хакатоне
		var userCount int64
		if err := hc.DB.Model(&models.BndUserHackathon{}).
			Where("hackathon_id = ? AND hackathon_role = ?", h.ID, 1).
			Count(&userCount).Error; err != nil {
			// В случае ошибки просто логируем её и устанавливаем 0
			log.Printf("Ошибка при подсчете пользователей хакатона %d: %v", h.ID, err)
			userCount = 0
		}

		// Создаем ShortInfo с camelCase именами полей (обновлено в соответствии с DTO)
		info := hackathonDTO.ShortInfo{
			ID:               h.ID,
			Name:             h.Name,
			Description:      h.Description,
			OrganizationName: h.Organization.LegalName,
			RegDateFrom:      h.RegDateFrom,
			RegDateTo:        h.RegDateTo,
			WorkDateFrom:     h.WorkDateFrom,
			WorkDateTo:       h.WorkDateTo,
			EvalDateFrom:     h.EvalDateFrom,
			EvalDateTo:       h.EvalDateTo,
			LogoId:           logoId,
			Technologies:     technologies,
			TotalAward:       totalAward,
			UserCount:        int(userCount),
		}

		hackathonInfoList = append(hackathonInfoList, info)
	}

	// Возвращаем данные с информацией о пагинации
	response := hackathonDTO.ListResponse{
		List:   hackathonInfoList,
		Total:  totalCount,
		Limit:  filterData.Limit,
		Offset: filterData.Offset,
	}

	c.JSON(http.StatusOK, response)
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
	// Получаем claims пользователя из контекста, установленные middleware Auth()
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима авторизация"})
		return
	}

	// Приводим claims к нужному типу
	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}

	// Парсим multipart форму
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка при парсинге формы: " + err.Error()})
		return
	}

	// Получаем JSON данные из поля 'data'
	hackathonDataJSON := c.Request.FormValue("data")
	if hackathonDataJSON == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствуют данные хакатона (поле 'data')"})
		return
	}

	// Десериализуем JSON в нашу DTO структуру
	var dto hackathonDTO.Update
	if err := json.Unmarshal([]byte(hackathonDataJSON), &dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка при разборе JSON: " + err.Error()})
		return
	}

	// Извлечение ID хакатона из URL
	hackathonID := c.Param("hackathon_id")
	if hackathonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	// Начинаем транзакцию
	tx := hc.DB.Begin()
	if err := tx.Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при начале транзакции"})
		return
	}

	// Функция для отката транзакции с возвратом ошибки
	rollbackWithError := func(statusCode int, message string) {
		tx.Rollback()
		c.JSON(statusCode, gin.H{"error": message})
	}

	// Установка userID для контекста (используется в FileController)
	c.Set("userID", claims.UserID)

	// Получаем хакатон с предварительной загрузкой всех связей
	var hackathon models.Hackathon
	if err := tx.Preload("Logo").
		Preload("Files").
		Preload("Technologies").
		Preload("Steps").
		Preload("Awards").
		Preload("Criteria").
		First(&hackathon, hackathonID).Error; err != nil {
		rollbackWithError(http.StatusNotFound, "Хакатон не найден")
		return
	}

	// Проверяем права на редактирование хакатона
	var isOrganizer bool
	if err := tx.Where("user_id = ? AND hackathon_id = ? AND hackathon_role = 3",
		claims.UserID, hackathon.ID).First(&models.BndUserHackathon{}).Error; err == nil {
		isOrganizer = true
	}

	// Проверяем права на администрирование
	if !isOrganizer && claims.SystemRole != 3 {
		rollbackWithError(http.StatusForbidden, "Недостаточно прав для редактирования хакатона")
		return
	}

	// Обновление основных полей хакатона
	hackathon = dto.ToModel(hackathon)

	// -------------------------------------------
	// Обработка логотипа
	// -------------------------------------------

	// Проверяем, есть ли новый логотип для загрузки
	logoFile, logoErr := c.FormFile("logo")
	hasNewLogo := logoErr == nil && logoFile != nil

	// Если у нас есть флаг удаления логотипа или загрузки нового, удаляем старый
	if (dto.DeleteLogo || hasNewLogo) && hackathon.Logo != nil {
		// Получаем ID текущего логотипа
		oldLogoID := hackathon.Logo.ID

		// Обнуляем связь с логотипом
		if err := tx.Model(&hackathon).Association("Logo").Clear(); err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при удалении старого логотипа")
			return
		}

		// Удаляем файл логотипа из БД
		if err := tx.Delete(&models.File{}, oldLogoID).Error; err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при удалении файла логотипа")
			return
		}

		// Обнуляем ссылку на логотип
		hackathon.Logo = nil
	}

	// Если есть новый логотип, загружаем его
	if hasNewLogo {
		// Загружаем новый логотип
		logoFile, err := hc.FileController.UploadFile(c, logoFile, hackathon.ID, "hackathon")
		if err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при загрузке логотипа: "+err.Error())
			return
		}

		// Устанавливаем новый логотип
		hackathon.Logo = logoFile

		// Сохраняем обновленный хакатон
		if err := tx.Save(&hackathon).Error; err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при сохранении хакатона")
			return
		}
	}

	// -------------------------------------------
	// Обработка удаления файлов
	// -------------------------------------------
	if len(dto.FilesToDelete) > 0 {
		for _, fileID := range dto.FilesToDelete {
			// Находим файл
			var file models.File
			if err := tx.First(&file, fileID).Error; err != nil {
				continue // Пропускаем, если файл не найден
			}

			// Проверяем, принадлежит ли файл хакатону
			if file.OwnerID != hackathon.ID {
				continue
			}

			// Проверяем, не является ли файл логотипом
			if hackathon.Logo != nil && file.ID == hackathon.Logo.ID {
				continue // Пропускаем логотип
			}

			// Отвязываем файл от хакатона перед удалением
			if err := tx.Model(&hackathon).Association("Files").Delete(&file); err != nil {
				rollbackWithError(http.StatusInternalServerError, "Ошибка при отвязывании файла")
				return
			}

			// Удаляем файл
			if err := tx.Delete(&file).Error; err != nil {
				rollbackWithError(http.StatusInternalServerError, "Ошибка при удалении файла")
				return
			}
		}
	}

	// -------------------------------------------
	// Загрузка новых файлов
	// -------------------------------------------
	form, formErr := c.MultipartForm()
	if formErr == nil && form != nil && form.File["files"] != nil {
		for _, fileHeader := range form.File["files"] {
			file, err := hc.FileController.UploadFile(c, fileHeader, hackathon.ID, "hackathon_file")
			if err != nil {
				rollbackWithError(http.StatusInternalServerError, "Ошибка при загрузке файла: "+err.Error())
				return
			}

			// Добавляем файл в Files хакатона
			if err := tx.Model(&hackathon).Association("Files").Append(file); err != nil {
				rollbackWithError(http.StatusInternalServerError, "Ошибка при привязке файла")
				return
			}
		}
	}

	// -------------------------------------------
	// Обновление технологий
	// -------------------------------------------
	if len(dto.Technologies) > 0 {
		// Сначала очищаем существующие связи
		if err := tx.Model(&hackathon).Association("Technologies").Clear(); err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при обновлении технологий")
			return
		}

		// Добавляем новые связи
		var technologies []models.Technology
		if err := tx.Where("id IN ?", dto.Technologies).Find(&technologies).Error; err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при поиске технологий")
			return
		}

		if err := tx.Model(&hackathon).Association("Technologies").Append(&technologies); err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при добавлении технологий")
			return
		}
	}

	// -------------------------------------------
	// Обработка менторов
	// -------------------------------------------

	// Обработка удаления приглашений менторов
	if len(dto.MentorInvitesToDelete) > 0 {
		for _, inviteID := range dto.MentorInvitesToDelete {
			// Находим приглашение
			var invite models.MentorInvite
			if err := tx.First(&invite, inviteID).Error; err != nil {
				continue // Пропускаем, если приглашение не найдено
			}

			// Проверяем, принадлежит ли приглашение хакатону
			if invite.HackathonID != hackathon.ID {
				continue
			}

			// Проверяем, есть ли пользователь в хакатоне как ментор
			var mentorRole models.BndUserHackathon
			if err := tx.Where("user_id = ? AND hackathon_id = ? AND hackathon_role = 2",
				invite.UserID, hackathon.ID).First(&mentorRole).Error; err == nil {
				// Пользователь уже ментор, нужно удалить его из хакатона
				if err := tx.Delete(&mentorRole).Error; err != nil {
					rollbackWithError(http.StatusInternalServerError, "Ошибка при удалении ментора из хакатона")
					return
				}
			}

			// Удаляем приглашение
			if err := tx.Delete(&invite).Error; err != nil {
				rollbackWithError(http.StatusInternalServerError, "Ошибка при удалении приглашения ментора")
				return
			}
		}
	}

	// Добавление новых приглашений
	if len(dto.Mentors) > 0 {
		// Обрабатываем новые приглашения для менторов
		var mentorInvites []models.MentorInvite
		for _, mentorID := range dto.Mentors {
			// Проверяем, не является ли пользователь уже ментором
			var existingMentor models.BndUserHackathon
			if err := tx.Where("user_id = ? AND hackathon_id = ? AND hackathon_role = 2",
				mentorID, hackathon.ID).First(&existingMentor).Error; err == nil {
				// Пользователь уже ментор, пропускаем
				continue
			}

			// Проверяем, нет ли уже приглашения для этого пользователя
			var existingInvite models.MentorInvite
			if err := tx.Where("user_id = ? AND hackathon_id = ?",
				mentorID, hackathon.ID).First(&existingInvite).Error; err == nil {
				// Приглашение уже существует, пропускаем
				continue
			}

			// Создаем новое приглашение
			invite := models.MentorInvite{
				UserID:      mentorID,
				HackathonID: hackathon.ID,
				Status:      0, // Статус "ожидает"
			}
			mentorInvites = append(mentorInvites, invite)
		}

		if len(mentorInvites) > 0 {
			if err := tx.Create(&mentorInvites).Error; err != nil {
				rollbackWithError(http.StatusInternalServerError, "Ошибка при создании приглашений менторов")
				return
			}
		}
	}

	// -------------------------------------------
	// Обновление этапов
	// -------------------------------------------
	if len(dto.Steps) > 0 {
		// Удаляем существующие этапы
		if err := tx.Where("hackathon_id = ?", hackathon.ID).Delete(&models.HackathonStep{}).Error; err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при удалении старых этапов")
			return
		}

		// Создаем новые этапы
		for _, step := range dto.Steps {
			stepModel := models.HackathonStep{
				HackathonID: hackathon.ID,
				Name:        step.Name,
				Description: step.Description,
				StartDate:   step.StartDate,
				EndDate:     step.EndDate,
			}

			if err := tx.Create(&stepModel).Error; err != nil {
				rollbackWithError(http.StatusInternalServerError, "Ошибка при создании этапа")
				return
			}
		}
	}

	// -------------------------------------------
	// Обновление наград
	// -------------------------------------------
	if len(dto.Awards) > 0 {
		// Удаляем существующие награды
		if err := tx.Where("hackathon_id = ?", hackathon.ID).Delete(&models.Award{}).Error; err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при удалении старых наград")
			return
		}

		// Создаем новые награды
		for _, award := range dto.Awards {
			awardModel := models.Award{
				HackathonID:  hackathon.ID,
				PlaceFrom:    award.PlaceFrom,
				PlaceTo:      award.PlaceTo,
				MoneyAmount:  award.MoneyAmount,
				Additionally: award.Additionally,
			}

			if err := tx.Create(&awardModel).Error; err != nil {
				rollbackWithError(http.StatusInternalServerError, "Ошибка при создании награды")
				return
			}
		}
	}

	// -------------------------------------------
	// Обновление критериев оценки
	// -------------------------------------------
	if len(dto.Criteria) > 0 {
		// Удаляем существующие критерии
		if err := tx.Where("hackathon_id = ?", hackathon.ID).Delete(&models.Criteria{}).Error; err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при удалении старых критериев")
			return
		}

		// Создаем новые критерии
		for _, criterion := range dto.Criteria {
			criterionModel := models.Criteria{
				HackathonID: hackathon.ID,
				Name:        criterion.Name,
				MinScore:    criterion.MinScore,
				MaxScore:    criterion.MaxScore,
			}

			if err := tx.Create(&criterionModel).Error; err != nil {
				rollbackWithError(http.StatusInternalServerError, "Ошибка при создании критерия")
				return
			}
		}
	}

	// Сохраняем обновленный хакатон в конце транзакции
	if err := tx.Save(&hackathon).Error; err != nil {
		rollbackWithError(http.StatusInternalServerError, "Ошибка при обновлении хакатона")
		return
	}

	// Завершаем транзакцию
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при подтверждении транзакции"})
		return
	}

	// Возвращаем обновленный хакатон
	c.JSON(http.StatusOK, hackathon)
}

func (hc *HackathonController) GetByIDFull(c *gin.Context) {
	// Получаем ID хакатона из параметров URL
	id := c.Param("hackathon_id")

	// Идентификатор текущего пользователя
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}

	userID := claims.UserID

	// Загружаем хакатон со всеми связанными данными
	var hackathon models.Hackathon
	if err := hc.DB.Preload("Logo").
		Preload("Files").
		Preload("Steps").
		Preload("Technologies").
		Preload("Awards").
		Preload("Criteria").
		Preload("Organization").
		First(&hackathon, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Получаем роль пользователя в хакатоне
	var userHackathon models.BndUserHackathon
	hackathonRole := 0 // 0 = не участник

	err := hc.DB.Where("user_id = ? AND hackathon_id = ?", userID, hackathon.ID).
		First(&userHackathon).Error

	if err == nil {
		hackathonRole = userHackathon.HackathonRole
	}

	// Проверяем права доступа

	// Подсчитываем количество пользователей в хакатоне
	var userCount int64
	hc.DB.Model(&models.BndUserHackathon{}).
		Where("hackathon_id = ? AND hackathon_role = 1", hackathon.ID).
		Count(&userCount)

	// Рассчитываем общую сумму наград
	var totalAward float64
	for _, award := range hackathon.Awards {
		totalAward += award.MoneyAmount * float64(award.PlaceTo-award.PlaceFrom+1)
	}

	// Преобразуем файлы в DTO
	filesDTOs := make([]fileDTO.GetShort, 0, len(hackathon.Files))
	for _, file := range hackathon.Files {
		filesDTOs = append(filesDTOs, fileDTO.GetShort{
			ID:   file.ID,
			Name: file.Name,
			Type: file.Type,
			Size: file.Size,
		})
	}

	// Преобразуем шаги в DTO
	stepsDTOs := make([]hackathonStepDTO.Get, 0, len(hackathon.Steps))
	for _, step := range hackathon.Steps {
		stepsDTOs = append(stepsDTOs, hackathonStepDTO.Get{
			ID:          step.ID,
			Name:        step.Name,
			Description: step.Description,
			StartDate:   step.StartDate,
			EndDate:     step.EndDate,
		})
	}

	// Преобразуем награды в DTO
	awardsDTOs := make([]awardDTO.Get, 0, len(hackathon.Awards))
	for _, award := range hackathon.Awards {
		awardsDTOs = append(awardsDTOs, awardDTO.Get{
			ID:           award.ID,
			MoneyAmount:  award.MoneyAmount,
			Additionally: award.Additionally,
			PlaceFrom:    award.PlaceFrom,
			PlaceTo:      award.PlaceTo,
		})
	}

	// Преобразуем технологии в DTO
	techDTOs := make([]technologyDTO.GetShort, 0, len(hackathon.Technologies))
	for _, tech := range hackathon.Technologies {
		techDTOs = append(techDTOs, technologyDTO.GetShort{
			ID:   tech.ID,
			Name: tech.Name,
		})
	}

	// Преобразуем критерии в DTO
	criteriaDTOs := make([]criteriaDTO.Get, 0, len(hackathon.Criteria))
	for _, criteria := range hackathon.Criteria {
		criteriaDTOs = append(criteriaDTOs, criteriaDTO.Get{
			ID:       criteria.ID,
			Name:     criteria.Name,
			MaxScore: criteria.MaxScore,
			MinScore: criteria.MinScore,
		})
	}

	currentTime := time.Now()
	canEdit := currentTime.Before(hackathon.RegDateFrom)

	// Создаем DTO с полной информацией о хакатоне
	fullInfo := hackathonDTO.FullBaseInfo{
		ID:               hackathon.ID,
		Name:             hackathon.Name,
		Description:      hackathon.Description,
		OrganizationName: hackathon.Organization.LegalName,

		RegDateFrom:  hackathon.RegDateFrom,
		RegDateTo:    hackathon.RegDateTo,
		WorkDateFrom: hackathon.WorkDateFrom,
		WorkDateTo:   hackathon.WorkDateTo,
		EvalDateFrom: hackathon.EvalDateFrom,
		EvalDateTo:   hackathon.EvalDateTo,

		LogoId:     0, // По умолчанию 0, обновим если логотип есть
		TotalAward: totalAward,
		UserCount:  int(userCount),

		Files:        filesDTOs,
		Steps:        stepsDTOs,
		Awards:       awardsDTOs,
		Technologies: techDTOs,
		Criteria:     criteriaDTOs,

		CanEdit: canEdit,

		HackathonRole: hackathonRole,
	}

	// Установим LogoId, если логотип есть
	if hackathon.Logo != nil {
		fullInfo.LogoId = hackathon.Logo.ID
	}

	c.JSON(http.StatusOK, fullInfo)
}

// Delete - Удаление хакатона по ID
func (hc *HackathonController) Delete(c *gin.Context) {
	id := c.Param("hackathon_id")
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

func (hc *HackathonController) AddUser(c *gin.Context) {
	// Извлечение данных пользователя из контекста
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}

	userID := claims.UserID

	// Извлечение ID хакатона из URL
	hackathonID := c.Param("hackathon_id")
	if hackathonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	var hackathon models.Hackathon
	if err := hc.DB.First(&hackathon, hackathonID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Проверка, не добавлен ли пользователь уже
	var existingUser models.BndUserHackathon
	if err := hc.DB.Where("user_id = ? AND hackathon_id = ?", userID, hackathon.ID).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь уже добавлен к хакатону"})
		return
	}

	// Добавление пользователя к хакатону
	userHackathon := models.BndUserHackathon{
		UserID:        userID,
		HackathonID:   hackathon.ID,
		HackathonRole: 1,
	}

	if err := hc.DB.Create(&userHackathon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при добавлении пользователя к хакатону", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Пользователь успешно добавлен к хакатону"})
}

func (pc *HackathonController) GetParticipants(c *gin.Context) {
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

	// Получение ID хакатона из URL
	hackathonID := c.Param("hackathon_id")
	if hackathonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Не указан ID хакатона"})
		return
	}

	// Проверка существования хакатона
	var hackathon models.Hackathon
	if err := pc.DB.First(&hackathon, hackathonID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Парсинг параметров фильтрации из тела запроса
	var filterData userDTO.ParticipantFilterData
	if err := c.ShouldBindJSON(&filterData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат фильтров"})
		return
	}

	// Получаем ID команды текущего пользователя, если он капитан
	var userTeamID *uint
	var userIsCaptain bool

	var userTeamInfo struct {
		TeamID   uint
		TeamRole int
	}

	teamRoleQuery := pc.DB.Model(&models.BndUserTeam{}).
		Select("bnd_user_teams.team_id, bnd_user_teams.team_role").
		Joins("JOIN teams ON bnd_user_teams.team_id = teams.id").
		Where("bnd_user_teams.user_id = ? AND teams.hackathon_id = ?", claims.UserID, hackathonID).
		Limit(1)

	if err := teamRoleQuery.First(&userTeamInfo).Error; err == nil && userTeamInfo.TeamRole == 2 {
		userIsCaptain = true
		userTeamID = &userTeamInfo.TeamID
	}

	// Структура для сбора информации о пользователях
	type UserWithTeamInfo struct {
		ID       uint
		Username string
		Email    string
		TeamName *string
	}

	// Подсчет общего количества участников
	var totalCount int64

	// Базовый запрос для подсчета
	countQuery := pc.DB.Model(&models.User{}).
		Joins("JOIN bnd_user_hackathons ON users.id = bnd_user_hackathons.user_id").
		Where("bnd_user_hackathons.hackathon_id = ?", hackathonID)

	// Добавляем фильтр по имени/email
	if filterData.Name != "" {
		searchTerm := "%" + filterData.Name + "%"
		countQuery = countQuery.Where("users.username LIKE ? OR users.email LIKE ?", searchTerm, searchTerm)
	}

	// Добавляем фильтр для "свободных" участников
	if filterData.IsFree {
		countQuery = countQuery.Where("NOT EXISTS (SELECT 1 FROM bnd_user_teams "+
			"JOIN teams ON bnd_user_teams.team_id = teams.id "+
			"WHERE bnd_user_teams.user_id = users.id AND teams.hackathon_id = ?)", hackathonID)
	}

	// Выполняем подсчет
	if err := countQuery.Count(&totalCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при подсчете участников: " + err.Error()})
		return
	}

	// Запрос для получения пользователей с информацией о команде
	var usersWithTeamInfo []UserWithTeamInfo

	// Строим запрос с использованием моделей GORM и выбираем нужные поля
	query := pc.DB.Model(&models.User{}).
		Select("DISTINCT users.id, users.username, users.email, teams.name AS team_name").
		Joins("JOIN bnd_user_hackathons buh ON users.id = buh.user_id").
		Joins("LEFT JOIN (SELECT but.user_id, but.team_id FROM bnd_user_teams but "+
			"JOIN teams t ON but.team_id = t.id WHERE t.hackathon_id = ?) AS filtered_teams "+
			"ON users.id = filtered_teams.user_id", hackathonID).
		Joins("LEFT JOIN teams ON filtered_teams.team_id = teams.id").
		Where("buh.hackathon_id = ?", hackathonID)

	// Добавляем фильтр по имени/email
	if filterData.Name != "" {
		searchTerm := "%" + filterData.Name + "%"
		query = query.Where("users.username LIKE ? OR users.email LIKE ?", searchTerm, searchTerm)
	}

	// Добавляем фильтр для "свободных" участников
	if filterData.IsFree {
		query = query.Where("teams.id IS NULL")
	}

	// Применяем пагинацию
	if filterData.Limit > 0 {
		query = query.Limit(filterData.Limit)
	}
	if filterData.Offset > 0 {
		query = query.Offset(filterData.Offset)
	}

	// Выполняем запрос
	if err := query.Find(&usersWithTeamInfo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении участников: " + err.Error()})
		return
	}

	// Получаем список всех активных приглашений от команды текущего пользователя
	type InviteInfo struct {
		UserID uint `gorm:"column:user_id"` // Указываем имя колонки в запросе
	}

	var invites []InviteInfo

	if userIsCaptain && userTeamID != nil {
		inviteQuery := pc.DB.Model(&models.TeamInvite{}).
			Select("team_invites.user_id").
			Where("team_invites.team_id = ? AND team_invites.status = ?", *userTeamID, 0)

		if err := inviteQuery.Find(&invites).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении приглашений: " + err.Error()})
			return
		}
	}

	// Создаем карту приглашенных пользователей для быстрого поиска
	invitedUsers := make(map[uint]bool)
	for _, invite := range invites {
		invitedUsers[invite.UserID] = true
	}

	// Формируем ответ с числовым статусом canInvite для каждого участника
	participants := make([]userDTO.ParticipantResponse, len(usersWithTeamInfo))
	for i, info := range usersWithTeamInfo {
		var canInviteStatus int = 0 // По умолчанию - не может пригласить

		if userIsCaptain && info.TeamName == nil && info.ID != claims.UserID {
			if invitedUsers[info.ID] {
				canInviteStatus = 2 // Уже приглашен
			} else {
				canInviteStatus = 1 // Может пригласить
			}
		}

		participants[i] = userDTO.ParticipantResponse{
			ID:        info.ID,
			Username:  info.Username,
			TeamName:  info.TeamName,
			CanInvite: canInviteStatus, // Числовой статус вместо булевого
		}
	}

	// Возвращаем результат с метаданными для пагинации
	c.JSON(http.StatusOK, gin.H{
		"list":   participants,
		"total":  totalCount,
		"limit":  filterData.Limit,
		"offset": filterData.Offset,
	})
}

func (hc *HackathonController) CreateTeam(c *gin.Context) {
	var team teamDTO.CreateDTO
	if err := c.ShouldBindJSON(&team); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации данных", "details": err.Error()})
		return
	}

	// Извлечение ID пользователя из claims
	claims := c.MustGet("user_claims").(*types.Claims)
	userID := claims.UserID

	// Извлечение ID хакатона из URL
	hackathonIDStr := c.Param("hackathon_id")
	if hackathonIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	// Преобразование ID хакатона из строки в uint
	hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный идентификатор хакатона"})
		return
	}

	var hackathon models.Hackathon
	// Поиск хакатона по ID
	if err := hc.DB.First(&hackathon, hackathonID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении хакатона", "details": err.Error()})
		return
	}

	// Проверка уникальности названия команды в рамках хакатона
	var existingTeam models.Team
	if err := hc.DB.Where("hackathon_id = ? AND name = ?", hackathonID, team.Name).First(&existingTeam).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Команда с таким названием уже существует в этом хакатоне"})
		return
	}

	// Проверка, состоит ли пользователь уже в команде в этом хакатоне
	var userTeam models.BndUserTeam
	if err := hc.DB.Where("user_id = ? AND team_id IN (SELECT id FROM teams WHERE hackathon_id = ?)", userID, hackathonID).First(&userTeam).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь уже состоит в команде в этом хакатоне"})
		return
	}

	// Установка HackathonID в модель команды
	teamModel := team.ToModel()
	teamModel.HackathonID = uint(hackathonID)

	// Создание команды
	if err := hc.DB.Create(&teamModel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании команды", "details": err.Error()})
		return
	}

	// Добавление создателя команды
	userTeam = models.BndUserTeam{
		UserID:   userID,
		TeamID:   teamModel.ID,
		TeamRole: 2,
	}

	if err := hc.DB.Create(&userTeam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при добавлении пользователя в команду", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, teamModel)
}

func (hc *HackathonController) GetTeam(c *gin.Context) {
	// Получение ID хакатона из параметров
	hackathonIDStr := c.Param("hackathon_id")
	if hackathonIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	// Преобразование ID хакатона из строки в uint
	hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный идентификатор хакатона"})
		return
	}

	// Получение информации о пользователе из контекста
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}

	// Поиск команды пользователя в этом хакатоне
	var userTeam models.Team

	// Сначала находим связь пользователя с командой через BndUserTeam
	var userTeamLink models.BndUserTeam
	teamQuery := hc.DB.
		Joins("JOIN teams ON bnd_user_teams.team_id = teams.id").
		Where("bnd_user_teams.user_id = ? AND teams.hackathon_id = ?", claims.UserID, hackathonID).
		First(&userTeamLink)

	if teamQuery.Error != nil {
		if teamQuery.Error == gorm.ErrRecordNotFound {
			// Пользователь не состоит в команде этого хакатона
			c.JSON(http.StatusOK, gin.H{
				"name":         nil, // Возвращаем null вместо пустой строки
				"participants": []interface{}{},
				"teamRole":     0, // Нет роли, т.к. не в команде
			})
			return
		}
		// Другая ошибка БД
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при поиске команды", "details": teamQuery.Error.Error()})
		return
	}

	// Теперь загружаем полную информацию о команде
	if err := hc.DB.First(&userTeam, userTeamLink.TeamID).Error; err != nil {
		// Если команда не найдена (хотя это странно, т.к. мы нашли связь)
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{
				"name":         nil,
				"participants": []interface{}{},
				"teamRole":     0,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении информации о команде"})
		return
	}

	// Загружаем всех участников команды
	var teamMembers []models.BndUserTeam
	if err := hc.DB.
		Preload("User").
		Where("team_id = ?", userTeam.ID).
		Find(&teamMembers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении участников команды"})
		return
	}

	// Формируем ответ в нужном формате
	var participants []userDTO.TeamParticipant
	for _, member := range teamMembers {
		participants = append(participants, userDTO.TeamParticipant{
			ID:       member.User.ID,
			Username: member.User.Username,
			TeamRole: member.TeamRole,
		})
	}

	// Используем указатель, чтобы значение могло быть null
	teamData := userDTO.TeamData{
		Name:         &userTeam.Name,
		Participants: participants,
		TeamRole:     userTeamLink.TeamRole, // Добавляем роль текущего пользователя
	}

	c.JSON(http.StatusOK, teamData)
}

func (hc *HackathonController) UpdateTeam(c *gin.Context) {
	var team teamDTO.UpdateDTO
	if err := c.ShouldBindJSON(&team); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации данных", "details": err.Error()})
		return
	}

	teamIDStr := c.Param("team_id")
	if teamIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор команды"})
		return
	}

	// Преобразование ID команды из строки в uint
	teamID, err := strconv.ParseUint(teamIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный идентификатор команды"})
		return
	}

	var existingTeam models.Team
	// Поиск команды по ID
	if err := hc.DB.First(&existingTeam, teamID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Команда не найдена"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении команды", "details": err.Error()})
		return
	}

	// Обновление данных команды с использованием метода ToModel
	updatedTeam := team.ToModel(existingTeam)

	// Сохранение изменений в базе данных
	if err := hc.DB.Save(updatedTeam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении команды", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedTeam) // Возвращаем обновлённую команду
}

func (hc *HackathonController) GetByIDEditFull(c *gin.Context) {
	// Получаем ID хакатона из параметров URL
	id := c.Param("hackathon_id")

	// Идентификатор текущего пользователя
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}

	userID := claims.UserID

	// Загружаем хакатон со всеми связанными данными
	var hackathon models.Hackathon
	if err := hc.DB.Preload("Logo").
		Preload("Files").
		Preload("Steps").
		Preload("Technologies").
		Preload("Awards").
		Preload("Criteria").
		Preload("Organization").
		First(&hackathon, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Проверяем, можно ли редактировать хакатон (до начала регистрации)
	currentTime := time.Now()
	if currentTime.After(hackathon.RegDateFrom) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Редактирование невозможно, регистрация уже началась"})
		return
	}

	// Получаем роль пользователя в хакатоне
	var userHackathon models.BndUserHackathon
	hackathonRole := 0 // 0 = не участник

	err := hc.DB.Where("user_id = ? AND hackathon_id = ?", userID, hackathon.ID).
		First(&userHackathon).Error

	if err == nil {
		hackathonRole = userHackathon.HackathonRole
	}

	// Подсчитываем количество пользователей в хакатоне
	var userCount int64
	hc.DB.Model(&models.BndUserHackathon{}).
		Where("hackathon_id = ? AND hackathon_role = 1", hackathon.ID).
		Count(&userCount)

	// Рассчитываем общую сумму наград
	var totalAward float64
	for _, award := range hackathon.Awards {
		totalAward += award.MoneyAmount * float64(award.PlaceTo-award.PlaceFrom+1)
	}

	// Преобразуем файлы в DTO
	filesDTOs := make([]fileDTO.GetShort, 0, len(hackathon.Files))
	for _, file := range hackathon.Files {
		filesDTOs = append(filesDTOs, fileDTO.GetShort{
			ID:   file.ID,
			Name: file.Name,
			Type: file.Type,
			Size: file.Size,
		})
	}

	// Преобразуем шаги в DTO
	stepsDTOs := make([]hackathonStepDTO.Get, 0, len(hackathon.Steps))
	for _, step := range hackathon.Steps {
		stepsDTOs = append(stepsDTOs, hackathonStepDTO.Get{
			ID:          step.ID,
			Name:        step.Name,
			Description: step.Description,
			StartDate:   step.StartDate,
			EndDate:     step.EndDate,
		})
	}

	// Преобразуем награды в DTO
	awardsDTOs := make([]awardDTO.Get, 0, len(hackathon.Awards))
	for _, award := range hackathon.Awards {
		awardsDTOs = append(awardsDTOs, awardDTO.Get{
			ID:           award.ID,
			MoneyAmount:  award.MoneyAmount,
			Additionally: award.Additionally,
			PlaceFrom:    award.PlaceFrom,
			PlaceTo:      award.PlaceTo,
		})
	}

	// Преобразуем технологии в DTO
	techDTOs := make([]technologyDTO.GetShort, 0, len(hackathon.Technologies))
	for _, tech := range hackathon.Technologies {
		techDTOs = append(techDTOs, technologyDTO.GetShort{
			ID:   tech.ID,
			Name: tech.Name,
		})
	}

	// Преобразуем критерии в DTO
	criteriaDTOs := make([]criteriaDTO.Get, 0, len(hackathon.Criteria))
	for _, criteria := range hackathon.Criteria {
		criteriaDTOs = append(criteriaDTOs, criteriaDTO.Get{
			ID:       criteria.ID,
			Name:     criteria.Name,
			MaxScore: criteria.MaxScore,
			MinScore: criteria.MinScore,
		})
	}

	// Получаем приглашения менторов с предварительной загрузкой пользователей
	var mentorInvites []models.MentorInvite
	if err := hc.DB.Preload("User").
		Where("hackathon_id = ?", hackathon.ID).
		Find(&mentorInvites).Error; err != nil {
		// Логируем ошибку, но продолжаем выполнение
		log.Printf("Ошибка при получении приглашений менторов: %v", err)
	}

	// Преобразуем приглашения менторов в DTO
	mentorInvitesDTOs := make([]mentorInviteDTO.Get, 0, len(mentorInvites))
	for _, invite := range mentorInvites {
		mentorInvitesDTOs = append(mentorInvitesDTOs, mentorInviteDTO.Get{
			Id:       int(invite.ID),
			Username: invite.User.Username, // Используем предзагруженное поле User
			Status:   invite.Status,
		})
	}

	// Создаем DTO с полной информацией о хакатоне
	fullInfo := hackathonDTO.FullBaseEditInfo{
		ID:               hackathon.ID,
		Name:             hackathon.Name,
		Description:      hackathon.Description,
		OrganizationId:   hackathon.Organization.ID,
		OrganizationName: hackathon.Organization.LegalName,

		RegDateFrom:  hackathon.RegDateFrom,
		RegDateTo:    hackathon.RegDateTo,
		WorkDateFrom: hackathon.WorkDateFrom,
		WorkDateTo:   hackathon.WorkDateTo,
		EvalDateFrom: hackathon.EvalDateFrom,
		EvalDateTo:   hackathon.EvalDateTo,

		LogoId:     0,
		TotalAward: totalAward,
		UserCount:  int(userCount),

		Files:         filesDTOs,
		Steps:         stepsDTOs,
		Awards:        awardsDTOs,
		Technologies:  techDTOs,
		Criteria:      criteriaDTOs,
		MentorInvites: mentorInvitesDTOs,

		HackathonRole: hackathonRole,
	}

	// Установим LogoId, если логотип есть
	if hackathon.Logo != nil {
		fullInfo.LogoId = hackathon.Logo.ID
	}

	c.JSON(http.StatusOK, fullInfo)
}

func (hc *HackathonController) DeleteTeam(c *gin.Context) {
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}

	userID := claims.UserID
	hackathonID, err := strconv.ParseUint(c.Param("hackathon_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID хакатона"})
		return
	}

	// Start a transaction
	tx := hc.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Find the team where user has role 2 in this hackathon
	var team models.Team
	if err := tx.Table("teams").
		Joins("JOIN bnd_user_teams ON bnd_user_teams.team_id = teams.id").
		Where("teams.hackathon_id = ? AND bnd_user_teams.user_id = ? AND bnd_user_teams.team_role = 2", hackathonID, userID).
		First(&team).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Не найдена команда с нужными правами в данном хакатоне"})
		return
	}

	// Delete team invitations
	if err := tx.Where("team_id = ?", team.ID).Delete(&models.TeamInvite{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении приглашений в команду"})
		return
	}

	// Delete team relationships
	if err := tx.Where("team_id = ?", team.ID).Delete(&models.BndUserTeam{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении связей команды"})
		return
	}

	// Delete the team
	if err := tx.Delete(&team).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении команды"})
		return
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении изменений"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Команда успешно удалена"})
}

func (hc *HackathonController) LeaveTeam(c *gin.Context) {
	// Получение данных пользователя из контекста
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}
	userID := claims.UserID

	// Получение ID хакатона из URL
	hackathonIDStr := c.Param("hackathon_id")
	hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный идентификатор хакатона"})
		return
	}

	// Начинаем транзакцию
	tx := hc.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Проверяем наличие пользователя в команде и его роль
	var userTeam struct {
		TeamID   uint
		TeamRole int
	}

	if err := tx.Table("bnd_user_teams").
		Select("bnd_user_teams.team_id, bnd_user_teams.team_role").
		Joins("JOIN teams ON bnd_user_teams.team_id = teams.id").
		Where("bnd_user_teams.user_id = ? AND teams.hackathon_id = ?", userID, hackathonID).
		First(&userTeam).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Вы не состоите в команде этого хакатона"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке членства в команде"})
		}
		return
	}

	// Проверяем, не является ли пользователь капитаном
	if userTeam.TeamRole == 2 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Капитан не может покинуть команду. Вы можете только расформировать команду."})
		return
	}

	// Удаляем связь пользователя с командой
	if err := tx.Where("user_id = ? AND team_id = ?", userID, userTeam.TeamID).Delete(&models.BndUserTeam{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при выходе из команды"})
		return
	}

	// Фиксируем транзакцию
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении изменений"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Вы успешно покинули команду"})
}

func (hc *HackathonController) KickTeam(c *gin.Context) {
	// Получение данных пользователя из контекста
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}
	captainID := claims.UserID

	// Получение ID хакатона из URL
	hackathonIDStr := c.Param("hackathon_id")
	hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный идентификатор хакатона"})
		return
	}

	// Получение ID пользователя для исключения из URL параметров
	userToKickIDStr := c.Param("user_id")
	if userToKickIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Не указан ID пользователя для исключения"})
		return
	}

	userToKickID, err := strconv.ParseUint(userToKickIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID пользователя для исключения"})
		return
	}

	// Начинаем транзакцию
	tx := hc.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Проверяем, является ли текущий пользователь капитаном команды
	var captainTeam struct {
		TeamID   uint
		TeamRole int
	}

	if err := tx.Table("bnd_user_teams").
		Select("bnd_user_teams.team_id, bnd_user_teams.team_role").
		Joins("JOIN teams ON bnd_user_teams.team_id = teams.id").
		Where("bnd_user_teams.user_id = ? AND teams.hackathon_id = ?", captainID, hackathonID).
		First(&captainTeam).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Вы не состоите в команде этого хакатона"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке членства в команде"})
		}
		return
	}

	// Проверяем, что пользователь является капитаном
	if captainTeam.TeamRole != 2 {
		tx.Rollback()
		c.JSON(http.StatusForbidden, gin.H{"error": "Только капитан команды может исключать участников"})
		return
	}

	// Проверяем, что исключаемый пользователь находится в той же команде
	var userToKickTeam models.BndUserTeam
	if err := tx.Where("user_id = ? AND team_id = ?", userToKickID, captainTeam.TeamID).First(&userToKickTeam).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Указанный пользователь не является участником вашей команды"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке участника команды"})
		}
		return
	}

	// Проверяем, что исключаемый пользователь не является капитаном
	if userToKickTeam.TeamRole == 2 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Нельзя исключить капитана команды"})
		return
	}

	// Удаляем связь пользователя с командой
	if err := tx.Delete(&userToKickTeam).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при исключении участника из команды"})
		return
	}

	// Фиксируем транзакцию
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении изменений"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Участник успешно исключен из команды"})
}

// GetTeamProject возвращает информацию о проекте команды участника хакатона

func (hc *HackathonController) GetTeamProject(c *gin.Context) {
	// Получаем ID хакатона из параметров URL
	hackathonIDStr := c.Param("hackathon_id")
	hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID хакатона"})
		return
	}

	// Получаем данные текущего пользователя из JWT токена
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}
	userID := claims.UserID

	// Находим команду пользователя для данного хакатона
	var userTeam struct {
		TeamID uint
	}
	if err := hc.DB.Table("bnd_user_teams").
		Select("team_id").
		Joins("JOIN teams ON bnd_user_teams.team_id = teams.id").
		Where("bnd_user_teams.user_id = ? AND teams.hackathon_id = ?", userID, hackathonID).
		First(&userTeam).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Вы не состоите в команде на этом хакатоне"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при поиске команды"})
		}
		return
	}

	// Получаем информацию о команде с проектом
	var team models.Team
	if err := hc.DB.Preload("Project").First(&team, userTeam.TeamID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Команда не найдена"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении данных команды"})
		}
		return
	}

	// Инициализируем пустой массив файлов
	files := []fileDTO.GetShort{}

	// Если у команды есть проект, добавляем его в массив файлов
	if team.Project != nil {
		// Создаем DTO для файла проекта
		fileDTO := fileDTO.GetShort{
			ID:   team.Project.ID,
			Name: team.Project.Name,
			Type: team.Project.Type,
			Size: team.Project.Size,
		}
		files = append(files, fileDTO)
	}

	// Возвращаем только массив файлов
	c.JSON(http.StatusOK, files)
}

// UploadTeamProject загружает или обновляет проект команды на хакатоне
func (hc *HackathonController) UploadTeamProject(c *gin.Context) {
	// Получаем ID хакатона из параметров URL
	hackathonIDStr := c.Param("hackathon_id")
	hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID хакатона"})
		return
	}

	// Получаем данные текущего пользователя из JWT токена
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}
	userID := claims.UserID

	// Устанавливаем userID в контекст для FileController
	c.Set("userID", userID)

	var hackathon models.Hackathon
	if err := hc.DB.Select("work_date_from, work_date_to").First(&hackathon, hackathonID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Проверяем текущую дату относительно дат работы хакатона
	currentTime := time.Now()
	if currentTime.Before(hackathon.WorkDateFrom) {
		c.JSON(http.StatusForbidden, gin.H{
			"error":          "Загрузка проекта будет доступна только после начала работы хакатона",
			"work_date_from": hackathon.WorkDateFrom,
		})
		return
	}
	if currentTime.After(hackathon.WorkDateTo) {
		c.JSON(http.StatusForbidden, gin.H{
			"error":        "Загрузка проекта недоступна, период работы хакатона завершен",
			"work_date_to": hackathon.WorkDateTo,
		})
		return
	}

	// Находим команду пользователя для данного хакатона
	var userTeam struct {
		TeamID uint
	}
	if err := hc.DB.Table("bnd_user_teams").
		Select("team_id").
		Joins("JOIN teams ON bnd_user_teams.team_id = teams.id").
		Where("bnd_user_teams.user_id = ? AND teams.hackathon_id = ?", userID, hackathonID).
		First(&userTeam).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Вы не состоите в команде на этом хакатоне"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при поиске команды"})
		}
		return
	}

	// Начинаем транзакцию
	tx := hc.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при начале транзакции"})
		return
	}

	// Функция для отката транзакции с возвратом ошибки
	rollbackWithError := func(statusCode int, message string) {
		tx.Rollback()
		c.JSON(statusCode, gin.H{"error": message})
	}

	// Получаем информацию о команде с проектом
	var team models.Team
	if err := tx.Preload("Project").First(&team, userTeam.TeamID).Error; err != nil {
		rollbackWithError(http.StatusInternalServerError, "Ошибка при получении данных команды")
		return
	}

	// Парсим multipart форму
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		rollbackWithError(http.StatusBadRequest, "Ошибка при парсинге формы: "+err.Error())
		return
	}

	// Обрабатываем JSON данные из запроса
	var requestData struct {
		FilesToDelete []uint `json:"files_to_delete"`
	}

	// Получаем JSON данные из поля 'data'
	projectDataJSON := c.Request.FormValue("data")
	if projectDataJSON != "" {
		if err := json.Unmarshal([]byte(projectDataJSON), &requestData); err != nil {
			rollbackWithError(http.StatusBadRequest, "Ошибка при разборе JSON данных")
			return
		}
	}

	// Проверяем наличие файлов для загрузки
	form, formErr := c.MultipartForm()
	hasNewFiles := formErr == nil && form != nil && form.File["files"] != nil && len(form.File["files"]) > 0

	// Проверяем, есть ли операции для выполнения
	if !hasNewFiles && len(requestData.FilesToDelete) == 0 {
		rollbackWithError(http.StatusBadRequest, "Не указаны файлы для загрузки или удаления")
		return
	}

	// Обработка удаления файлов
	if len(requestData.FilesToDelete) > 0 && team.Project != nil {
		for _, fileID := range requestData.FilesToDelete {
			if team.Project.ID == fileID {
				// Удаляем файл проекта
				if err := tx.Delete(&models.File{}, fileID).Error; err != nil {
					rollbackWithError(http.StatusInternalServerError, "Ошибка при удалении файла проекта")
					return
				}
				team.Project = nil
				break
			}
		}
	}

	// Загрузка нового проекта
	if hasNewFiles {
		// Если уже есть проект и мы его не удалили в предыдущем шаге, удаляем
		if team.Project != nil {
			oldFileID := team.Project.ID

			// Удаляем старый файл (если его нет в списке filesToDelete)
			alreadyDeleted := false
			for _, id := range requestData.FilesToDelete {
				if id == oldFileID {
					alreadyDeleted = true
					break
				}
			}

			if !alreadyDeleted {
				if err := tx.Delete(&models.File{}, oldFileID).Error; err != nil {
					rollbackWithError(http.StatusInternalServerError, "Ошибка при удалении старого файла проекта")
					return
				}
			}
		}

		// Загружаем файл проекта
		newFile, err := hc.FileController.UploadFile(c, form.File["files"][0], team.ID, "team")
		if err != nil {
			rollbackWithError(http.StatusInternalServerError, "Ошибка при загрузке файла проекта: "+err.Error())
			return
		}

		// Обновляем проект команды
		team.Project = newFile
	}

	// Применяем транзакцию
	if err := tx.Commit().Error; err != nil {
		rollbackWithError(http.StatusInternalServerError, "Ошибка при сохранении изменений")
		return
	}

	c.JSON(http.StatusOK, "")
}

// GetHackathonRole возвращает роль текущего пользователя в хакатоне
func (hc *HackathonController) GetHackathonRole(c *gin.Context) {
	// Получаем ID хакатона из параметров URL
	hackathonIDStr := c.Param("hackathon_id")
	hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID хакатона"})
		return
	}

	// Получаем данные текущего пользователя из JWT токена
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}
	userID := claims.UserID

	// Ищем запись связи пользователя с хакатоном
	var userHackathon models.BndUserHackathon
	result := hc.DB.Where("user_id = ? AND hackathon_id = ?", userID, hackathonID).First(&userHackathon)

	// Получаем информацию о хакатоне для определения состояний
	var hackathon models.Hackathon
	if err := hc.DB.First(&hackathon, hackathonID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Определяем текущие состояния хакатона
	currentTime := time.Now()
	isRegistration := currentTime.After(hackathon.RegDateFrom) && currentTime.Before(hackathon.RegDateTo)
	isWork := currentTime.After(hackathon.WorkDateFrom) && currentTime.Before(hackathon.WorkDateTo)
	isEvaluation := currentTime.After(hackathon.EvalDateFrom) && currentTime.Before(hackathon.EvalDateTo)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// Пользователь не связан с хакатоном
			c.JSON(http.StatusOK, gin.H{
				"role":           0,
				"isRegistration": isRegistration,
				"isWork":         isWork,
				"isEvaluation":   isEvaluation,
			})
			return
		}
		// Возникла другая ошибка БД
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке роли"})
		return
	}

	// Возвращаем роль пользователя в хакатоне и состояния хакатона
	c.JSON(http.StatusOK, gin.H{
		"role":           userHackathon.HackathonRole,
		"isRegistration": isRegistration,
		"isWork":         isWork,
		"isEvaluation":   isEvaluation,
	})
}

func (hc *HackathonController) GetValidateProjects(c *gin.Context) {
	// Получаем ID хакатона из URL
	hackathonIDStr := c.Param("hackathon_id")
	hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID хакатона"})
		return
	}

	// Получаем параметры фильтрации
	var filter hackathonDTO.GetValidateProjectsFilter

	if err := c.ShouldBindJSON(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат параметров фильтрации"})
		return
	}

	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}

	// Получаем ID текущего пользователя из токена
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}
	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}
	userID := claims.UserID

	// Проверяем, имеет ли пользователь право оценивать проекты в этом хакатоне
	var userHackathon models.BndUserHackathon
	if err := hc.DB.Where("user_id = ? AND hackathon_id = ?", userID, hackathonID).First(&userHackathon).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет доступа к оценке проектов в этом хакатоне"})
		return
	}

	// Получаем все команды хакатона с проектами
	var allTeams []models.Team
	if err := hc.DB.Where("hackathon_id = ?", hackathonID).Preload("Project").Find(&allTeams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении команд"})
		return
	}

	// Получаем все оценки для команд хакатона
	var allScores []models.Score
	teamIDs := make([]uint, 0, len(allTeams))
	for _, team := range allTeams {
		teamIDs = append(teamIDs, team.ID)
	}

	if len(teamIDs) > 0 {
		if err := hc.DB.Where("team_id IN ?", teamIDs).Find(&allScores).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении оценок"})
			return
		}
	}

	// Создаем карту команд с оценками
	teamsWithScores := make(map[uint]bool)
	for _, score := range allScores {
		teamsWithScores[score.TeamID] = true
	}

	// Фильтруем команды в соответствии с критерием
	var filteredTeams []models.Team

	for _, team := range allTeams {
		hasScores := teamsWithScores[team.ID]

		// Применяем фильтр
		if filter.Validate == 1 && hasScores {
			// Только с оценками
			filteredTeams = append(filteredTeams, team)
		} else if filter.Validate == -1 && !hasScores {
			// Только без оценок
			filteredTeams = append(filteredTeams, team)
		} else if filter.Validate == 0 {
			// Все команды
			filteredTeams = append(filteredTeams, team)
		}
	}

	// Вычисляем общее количество для пагинации
	totalCount := int64(len(filteredTeams))

	// Применяем пагинацию
	start := filter.Offset
	end := filter.Offset + filter.Limit
	if start > int(totalCount) {
		start = int(totalCount)
	}
	if end > int(totalCount) {
		end = int(totalCount)
	}

	// Получаем подмножество для текущей страницы
	var paginatedTeams []models.Team
	if start < end {
		paginatedTeams = filteredTeams[start:end]
	}

	// Получаем критерии оценки для этого хакатона
	var criteria []models.Criteria
	if err := hc.DB.Where("hackathon_id = ?", hackathonID).Order("id").Find(&criteria).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении критериев оценки"})
		return
	}

	// Подсчитываем максимально возможное количество баллов
	var maxScore uint
	for _, criterion := range criteria {
		maxScore += criterion.MaxScore
	}

	// Создаем карту оценок по командам
	scoreByTeam := make(map[uint][]models.Score)
	for _, score := range allScores {
		scoreByTeam[score.TeamID] = append(scoreByTeam[score.TeamID], score)
	}

	// Формируем ответ в соответствии с ожидаемой структурой на фронтенде
	var validateProjects []gin.H
	for _, team := range paginatedTeams {
		// Проверяем, есть ли у команды загруженный проект
		if team.Project == nil {
			continue // Пропускаем команды без проектов
		}

		// Вычисляем общую оценку, если она есть
		var summaryScore float64
		var hasScore bool

		teamScores := scoreByTeam[team.ID]
		if len(teamScores) > 0 {
			// Находим сумму всех оценок
			for _, score := range teamScores {
				summaryScore += score.Score
			}
			hasScore = true
		}

		var summaryValue interface{} = nil
		if hasScore {
			summaryValue = summaryScore
		}

		// Создаем объект ValidateProject
		projectInfo := gin.H{
			"project": gin.H{
				"id":   team.Project.ID,
				"name": team.Project.Name,
				"type": team.Project.Type,
				"size": team.Project.Size,
			},
			"summary":  summaryValue,
			"teamName": team.Name,
			"teamId":   team.ID,
		}

		validateProjects = append(validateProjects, projectInfo)
	}

	// Создаем карту оценок критериев
	criteriaScores := make(map[uint]models.Score)
	for _, score := range allScores {
		criteriaScores[score.CriteriaID] = score
	}

	// Создаем объекты ValidateCriteria с заполненными оценками
	var validateCriteria []gin.H
	for _, criterion := range criteria {
		// Получаем оценку для данного критерия, если она есть
		var value int = 0
		var comment string = ""

		if score, exists := criteriaScores[criterion.ID]; exists {
			value = int(score.Score)
			comment = score.Comment
		}

		criteriaInfo := gin.H{
			"name":     criterion.Name,
			"maxScore": criterion.MaxScore,
			"minScore": criterion.MinScore,
			"value":    value,
			"comment":  comment,
		}

		validateCriteria = append(validateCriteria, criteriaInfo)
	}

	// Итоговый ответ с добавлением maxScore
	response := gin.H{
		"list":     validateProjects,
		"criteria": validateCriteria,
		"total":    totalCount,
		"maxScore": maxScore,
	}

	c.JSON(http.StatusOK, response)
}

func (h *HackathonController) SubmitProjectRating(c *gin.Context) {
	// Получаем ID хакатона и команды из параметров URL
	hackathonIDStr := c.Param("hackathon_id")
	teamIDStr := c.Param("team_id")

	hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID хакатона"})
		return
	}

	teamID, err := strconv.ParseUint(teamIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID команды"})
		return
	}

	// Получаем ID текущего пользователя из контекста
	userClaims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}
	userID := claims.UserID

	// Проверяем, имеет ли пользователь роль судьи (2 или 3) в этом хакатоне
	var userHackathon models.BndUserHackathon
	result := h.DB.Where("user_id = ? AND hackathon_id = ?", userID, hackathonID).First(&userHackathon)

	if result.Error != nil || (userHackathon.HackathonRole != 2 && userHackathon.HackathonRole != 3) {
		c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет прав для оценки проектов в этом хакатоне"})
		return
	}

	// Проверяем, существует ли команда в данном хакатоне
	var teamCount int64
	if err := h.DB.Model(&models.Team{}).
		Where("id = ? AND hackathon_id = ?", teamID, hackathonID).
		Count(&teamCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке команды"})
		return
	}

	if teamCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Команда не найдена или не принадлежит данному хакатону"})
		return
	}

	// Получаем список критериев для хакатона
	var criteria []models.Criteria
	if err := h.DB.Where("hackathon_id = ?", hackathonID).
		Order("id").Find(&criteria).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении критериев"})
		return
	}

	// Разбираем тело запроса - массив оценок
	var criteriaInputs []hackathonDTO.ValidateCriteriaInput
	if err := c.ShouldBindJSON(&criteriaInputs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный формат данных"})
		return
	}

	// Проверяем, что количество оценок совпадает с количеством критериев
	if len(criteriaInputs) != len(criteria) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "Количество оценок не совпадает с количеством критериев",
			"expected": len(criteria),
			"received": len(criteriaInputs),
		})
		return
	}

	// Валидируем оценки и сохраняем их в транзакции
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		// Удаляем существующие оценки данного судьи для этой команды
		if err := tx.Where("team_id = ?", teamID).
			Delete(&models.Score{}).Error; err != nil {
			return err
		}

		// Создаем новые оценки для каждого критерия
		for i, input := range criteriaInputs {
			criterion := criteria[i]

			// Проверка, что оценка в допустимом диапазоне
			if input.Value < int(criterion.MinScore) || input.Value > int(criterion.MaxScore) {
				return fmt.Errorf(
					"оценка для критерия '%s' должна быть в диапазоне от %d до %d, получено: %d",
					criterion.Name, criterion.MinScore, criterion.MaxScore, input.Value,
				)
			}

			// Создаем запись оценки (используем UserID для идентификации судьи)
			score := models.Score{
				TeamID:     uint(teamID),
				CriteriaID: criterion.ID,
				Score:      float64(input.Value),
				Comment:    input.Comment,
			}

			if err := tx.Create(&score).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Оценки успешно сохранены",
	})
}

func (hc *HackathonController) GetResults(c *gin.Context) {
	// Получаем ID хакатона из параметров URL
	hackathonIDStr := c.Param("hackathon_id")
	hackathonID, err := strconv.ParseUint(hackathonIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID хакатона"})
		return
	}

	// Проверяем существование хакатона
	var hackathon models.Hackathon
	if err := hc.DB.First(&hackathon, hackathonID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Получаем максимально возможный балл (сумма maxScore всех критериев)
	var maxScore float64
	if err := hc.DB.Model(&models.Criteria{}).
		Where("hackathon_id = ?", hackathonID).
		Select("COALESCE(SUM(max_score), 0)").
		Scan(&maxScore).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при подсчете максимального балла"})
		return
	}

	// Получаем все команды для этого хакатона
	var teams []models.Team
	if err := hc.DB.Where("hackathon_id = ?", hackathonID).
		Preload("Project").
		Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении команд"})
		return
	}

	// Собираем все ID команд
	var teamIDs []uint
	for _, team := range teams {
		teamIDs = append(teamIDs, team.ID)
	}

	// Структура для хранения данных соединенных таблиц
	type ScoreWithCriteria struct {
		TeamID       uint    `gorm:"column:team_id"`
		ScoreID      uint    `gorm:"column:id"`
		CriteriaID   uint    `gorm:"column:criteria_id"`
		Score        float64 `gorm:"column:score"`
		Comment      string  `gorm:"column:comment"`
		CriteriaName string  `gorm:"column:name"`
		MaxScore     uint    `gorm:"column:max_score"`
	}

	// Используем GORM для соединения таблиц
	var scoresWithCriteria []ScoreWithCriteria
	if err := hc.DB.Model(&models.Score{}).
		Select("scores.team_id, scores.id, scores.criteria_id, scores.score, scores.comment, criteria.name, criteria.max_score").
		Joins("INNER JOIN criteria ON scores.criteria_id = criteria.id").
		Where("scores.team_id IN ?", teamIDs).
		Scan(&scoresWithCriteria).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении оценок: " + err.Error()})
		return
	}

	// Группируем оценки по командам
	teamScoresMap := make(map[uint][]ScoreWithCriteria)
	for _, score := range scoresWithCriteria {
		teamScoresMap[score.TeamID] = append(teamScoresMap[score.TeamID], score)
	}

	// Рассчитываем суммарные баллы для каждой команды
	type TeamWithScore struct {
		ID    uint
		Name  string
		Score float64
	}

	var teamsWithScores []TeamWithScore
	for _, team := range teams {
		var totalScore float64
		for _, score := range teamScoresMap[team.ID] {
			totalScore += score.Score
		}

		teamsWithScores = append(teamsWithScores, TeamWithScore{
			ID:    team.ID,
			Name:  team.Name,
			Score: totalScore,
		})
	}

	// Сортируем команды по убыванию баллов
	sort.Slice(teamsWithScores, func(i, j int) bool {
		return teamsWithScores[i].Score > teamsWithScores[j].Score
	})

	// Определяем место каждой команды
	teamPlaces := make(map[uint]int)
	currentPlace := 1
	previousScore := -1.0

	for _, team := range teamsWithScores {
		if previousScore != team.Score {
			currentPlace = len(teamPlaces) + 1
			previousScore = team.Score
		}
		teamPlaces[team.ID] = currentPlace
	}

	// Получаем все награды для этого хакатона
	var awards []models.Award
	if err := hc.DB.Where("hackathon_id = ?", hackathonID).Find(&awards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении наград"})
		return
	}

	// Создаем маппинг для быстрого поиска награды по месту
	awardsByPlace := make(map[int]models.Award)
	for _, award := range awards {
		for place := award.PlaceFrom; place <= award.PlaceTo; place++ {
			awardsByPlace[place] = award
		}
	}

	// Создаем мапу баллов команд для быстрого доступа
	teamScoresTotal := make(map[uint]float64)
	for _, team := range teamsWithScores {
		teamScoresTotal[team.ID] = team.Score
	}

	// Формируем ответ
	type AwardInfo struct {
		MoneyAmount  float64 `json:"moneyAmount"`
		Additionally string  `json:"additionally"`
	}

	type CriteriaScore struct {
		Name     string  `json:"name"`
		MaxScore uint    `json:"maxScore"`
		Score    float64 `json:"score"`
		Comment  string  `json:"comment"`
	}

	type Result struct {
		TeamName string            `json:"teamName"`
		Score    float64           `json:"score"`
		Project  *fileDTO.GetShort `json:"project,omitempty"`
		Award    *AwardInfo        `json:"award,omitempty"`
		Criteria []CriteriaScore   `json:"criteria"`
	}

	// Формируем массив результатов
	results := make([]Result, 0, len(teams))
	for _, team := range teams {
		// Получаем оценки для текущей команды
		teamScores := teamScoresMap[team.ID]

		criteriaScores := make([]CriteriaScore, 0, len(teamScores))

		// Перебираем все оценки команды
		for _, score := range teamScores {
			criteriaScores = append(criteriaScores, CriteriaScore{
				Name:     score.CriteriaName,
				MaxScore: score.MaxScore,
				Score:    score.Score,
				Comment:  score.Comment,
			})
		}

		result := Result{
			TeamName: team.Name,
			Score:    teamScoresTotal[team.ID],
			Criteria: criteriaScores,
		}

		// Добавляем информацию о проекте, если он есть
		if team.Project != nil {
			result.Project = &fileDTO.GetShort{
				ID:   team.Project.ID,
				Name: team.Project.Name,
				Size: team.Project.Size,
				Type: team.Project.Type,
			}
		}

		// Добавляем информацию о награде, если команда в призовых местах
		if place, exists := teamPlaces[team.ID]; exists {
			if award, hasAward := awardsByPlace[place]; hasAward {
				result.Award = &AwardInfo{
					MoneyAmount:  award.MoneyAmount,
					Additionally: award.Additionally,
				}
			}
		}

		results = append(results, result)
	}

	// Сортируем результаты по баллам (убывание)
	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	c.JSON(http.StatusOK, gin.H{
		"list":     results,
		"maxScore": maxScore,
	})
}
