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

	// Базовый запрос для подсчета общего количества
	// Добавляем фильтр по статусу = 1
	countQuery := hc.DB.Model(&models.Hackathon{}).Where("status = ?", 0)

	// Базовый запрос для получения данных с предзагрузкой связанных данных
	// Также фильтруем по статусу = 1
	dataQuery := hc.DB.Model(&models.Hackathon{}).
		Where("status = ?", 0).
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

		if filterData.MinTeamSize > 0 {
			query = query.Where("hackathons.min_team_size >= ?", filterData.MinTeamSize)
		}

		if filterData.MaxTeamSize > 0 {
			query = query.Where("hackathons.max_team_size <= ?", filterData.MaxTeamSize)
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
			MinTeamSize:      h.MinTeamSize,
			MaxTeamSize:      h.MaxTeamSize,
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
	// Если хакатон не опубликован (статус != 1) и пользователь не организатор/администратор
	if hackathon.Status != 1 && hackathonRole != 2 && hackathonRole != 3 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет доступа к хакатону"})
		return
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

		Status: hackathon.Status,

		LogoId:      0, // По умолчанию 0, обновим если логотип есть
		TotalAward:  totalAward,
		MinTeamSize: hackathon.MinTeamSize,
		MaxTeamSize: hackathon.MaxTeamSize,
		UserCount:   int(userCount),

		Files:        filesDTOs,
		Steps:        stepsDTOs,
		Awards:       awardsDTOs,
		Technologies: techDTOs,
		Criteria:     criteriaDTOs,

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

func (hc *HackathonController) GetUsers(c *gin.Context) {
	// Извлечение ID хакатона из URL
	hackathonID := c.Param("hackathon_id")
	if hackathonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	var hackathon models.Hackathon
	// Поиск хакатона по ID и предзагрузка связанных пользователей
	if err := hc.DB.Preload("Users").First(&hackathon, hackathonID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении хакатона", "details": err.Error()})
		return
	}

	// Извлечение пользователей из связанной структуры
	var usersWithRoles []userDTO.UserWithHackathonRoleDTO
	for _, userHackathon := range hackathon.Users {
		var user models.User
		if err := hc.DB.First(&user, userHackathon.UserID).Error; err == nil {
			avatarURL := ""
			if user.Avatar != nil {
				avatarURL = user.Avatar.URL // Проверяем, что Avatar не nil
			}
			usersWithRoles = append(usersWithRoles, userDTO.UserWithHackathonRoleDTO{
				Id:            user.ID,
				Username:      user.Username,
				Email:         user.Email,
				SystemRole:    user.SystemRole,
				Avatar:        avatarURL,
				HackathonRole: userHackathon.HackathonRole,
			})
		}
	}

	if len(usersWithRoles) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Пользователи не найдены для данного хакатона"})
		return
	}

	c.JSON(http.StatusOK, usersWithRoles)
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

	// Проверка, состоит ли пользователь уже в команде в этом хакатоне
	var userTeam models.BndUserTeam
	if err := hc.DB.Where("user_id = ? AND team_id IN (SELECT id FROM teams WHERE hackathon_id = ?)", userID, hackathonID).First(&userTeam).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь уже состоит в команде в этом хакатоне"})
		return
	}

	// Установка HackathonID в модель команды
	teamModel := team.ToModel()
	teamModel.HackathonID = uint(hackathonID) // Убедитесь, что HackathonID установлен

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

func (hc *HackathonController) GetTeams(c *gin.Context) {
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

	var teams []models.Team
	// Поиск команд по ID хакатона с предзагрузкой участников
	if err := hc.DB.Preload("Users").Where("hackathon_id = ?", hackathonID).Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении команд", "details": err.Error()})
		return
	}

	// Формирование упрощённого ответа
	var teamDTOs []teamDTO.GetDTO
	for _, team := range teams {
		var userDTOs []userDTO.GetUserInTeamMini
		for _, userTeam := range team.Users {
			userDTOs = append(userDTOs, userDTO.GetUserInTeamMini{
				UserID:   userTeam.UserID,
				TeamRole: userTeam.TeamRole,
				Username: userTeam.User.Username, // Предполагается, что у вас есть поле Username в модели User
			})
		}
		teamDTOs = append(teamDTOs, teamDTO.GetDTO{
			ID:          team.ID,
			Name:        team.Name,
			HackathonID: team.HackathonID,
			Users:       userDTOs,
		})
	}

	if len(teamDTOs) == 0 {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	c.JSON(http.StatusOK, teamDTOs)
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

	// Получаем роль пользователя в хакатоне
	var userHackathon models.BndUserHackathon
	hackathonRole := 0 // 0 = не участник

	err := hc.DB.Where("user_id = ? AND hackathon_id = ?", userID, hackathon.ID).
		First(&userHackathon).Error

	if err == nil {
		hackathonRole = userHackathon.HackathonRole
	}

	// Проверяем права доступа
	// Если хакатон не опубликован (статус != 1) и пользователь не организатор/администратор
	if hackathon.Status != 1 && hackathonRole != 2 && hackathonRole != 3 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет доступа к хакатону"})
		return
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

		Status: hackathon.Status,

		LogoId:      0, // По умолчанию 0, обновим если логотип есть
		TotalAward:  totalAward,
		MinTeamSize: hackathon.MinTeamSize,
		MaxTeamSize: hackathon.MaxTeamSize,
		UserCount:   int(userCount),

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
