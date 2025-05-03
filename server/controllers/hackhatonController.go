package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/models/DTO/hackathonDTO"
	"server/models/DTO/teamDTO"
	"server/models/DTO/userDTO"
	"server/types"
	"strconv"
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
// CreateHackathon - метод для создания хакатона
func (hc *HackathonController) CreateHackathon(c *gin.Context) {
	fmt.Println("Начало обработки запроса CreateHackathon")

	// Получаем claims пользователя из контекста, установленные middleware Auth()
	userClaims, exists := c.Get("user_claims")
	if !exists {
		fmt.Println("Ошибка: Отсутствует user_claims в контексте")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима авторизация"})
		return
	}

	// Приводим claims к нужному типу
	claims, ok := userClaims.(*types.Claims)
	if !ok {
		fmt.Println("Ошибка: Невозможно привести user_claims к типу *types.Claims")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		return
	}
	fmt.Printf("User ID: %d, System Role: %d\n", claims.UserID, claims.SystemRole)

	// Парсим multipart форму
	fmt.Println("Парсинг multipart формы")
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		fmt.Printf("Ошибка при парсинге формы: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка при парсинге формы: " + err.Error()})
		return
	}

	// Получаем JSON данные из поля 'data'
	hackathonDataJSON := c.Request.FormValue("data")
	if hackathonDataJSON == "" {
		fmt.Println("Ошибка: Отсутствуют данные в поле 'data'")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствуют данные хакатона (поле 'data')"})
		return
	}
	fmt.Println("Получены данные JSON:", hackathonDataJSON[:100]+"...") // Логируем первые 100 символов

	// Десериализуем JSON в нашу DTO структуру
	var dto hackathonDTO.CreateDTO
	if err := json.Unmarshal([]byte(hackathonDataJSON), &dto); err != nil {
		fmt.Printf("Ошибка при разборе JSON: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка при разборе JSON: " + err.Error()})
		return
	}
	fmt.Printf("Десериализованная DTO: Name=%s, OrgID=%d, Stages=%d, Criteria=%d, Awards=%d\n",
		dto.Name, dto.OrganizationID, len(dto.Steps), len(dto.Criteria), len(dto.Awards))

	// Валидируем DTO
	fmt.Println("Валидация DTO")
	validate := validator.New()
	if err := validate.Struct(dto); err != nil {
		fmt.Printf("Ошибка валидации: %v\n", err)
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

	// Проверяем права на создание хакатона в этой организации
	fmt.Printf("Поиск организации с ID=%d\n", dto.OrganizationID)
	var organization models.Organization
	if err := hc.DB.First(&organization, dto.OrganizationID).Error; err != nil {
		fmt.Printf("Ошибка при поиске организации: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
		return
	}
	fmt.Printf("Найдена организация: ID=%d, OwnerID=%d\n", organization.ID, organization.OwnerID)

	// Проверяем, что пользователь является владельцем организации
	if organization.OwnerID != claims.UserID {
		fmt.Printf("Пользователь ID=%d не является владельцем организации ID=%d\n", claims.UserID, organization.ID)
		// Дополнительно можно проверить, является ли пользователь администратором
		if claims.SystemRole != 3 { // Предполагаю, что 3 - это роль администратора
			fmt.Printf("Пользователь не имеет роли администратора (роль=%d)\n", claims.SystemRole)
			c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав для создания хакатона в этой организации"})
			return
		}
		fmt.Println("Пользователь имеет права администратора, доступ разрешен")
	}

	// Создаем хакатон в транзакции
	fmt.Println("Начало транзакции создания хакатона")
	var hackathon models.Hackathon
	err := hc.DB.Transaction(func(tx *gorm.DB) error {
		// Преобразуем DTO в модель
		fmt.Println("Преобразование DTO в модель хакатона")
		hackathon = *dto.ToModel()
		fmt.Printf("Созданная модель: ID=%d, Name=%s\n", hackathon.ID, hackathon.Name)

		// Создаем запись хакатона
		fmt.Println("Сохранение хакатона в БД")
		if err := tx.Create(&hackathon).Error; err != nil {
			fmt.Printf("Ошибка при создании хакатона: %v\n", err)
			return err
		}
		fmt.Printf("Хакатон создан с ID=%d\n", hackathon.ID)

		// Добавляем связь создателя хакатона как организатора
		fmt.Println("Добавление связи с организатором")
		userHackathon := models.BndUserHackathon{
			UserID:        claims.UserID,
			HackathonID:   hackathon.ID,
			HackathonRole: 3, // Роль организатора
		}

		if err := tx.Create(&userHackathon).Error; err != nil {
			fmt.Printf("Ошибка при создании связи с организатором: %v\n", err)
			return err
		}
		fmt.Println("Связь с организатором создана")

		// Загружаем логотип хакатона, если он есть
		c.Set("userID", claims.UserID)
		logoFile, err := c.FormFile("logo")
		if err != nil {
			fmt.Printf("Логотип не найден: %v\n", err)
		} else if logoFile != nil {
			fmt.Printf("Найден логотип: %s, размер: %d\n", logoFile.Filename, logoFile.Size)
			file, err := hc.FileController.UploadFile(c, logoFile, hackathon.ID, "hackathon")
			if err != nil {
				fmt.Printf("Ошибка при загрузке логотипа: %v\n", err)
				return err
			}
			fmt.Printf("Логотип загружен, ID файла=%v\n", file.ID)

			// Обновляем хакатон с привязкой к логотипу
			if err := tx.Model(&hackathon).Association("Logo").Replace(file); err != nil {
				fmt.Printf("Ошибка при связывании логотипа с хакатоном: %v\n", err)
				return err
			}
			fmt.Println("Логотип привязан к хакатону")
		}

		// Загружаем дополнительные файлы, если они есть
		fmt.Println("Проверка наличия дополнительных файлов")
		form, err := c.MultipartForm()
		if err != nil {
			fmt.Printf("Ошибка при получении MultipartForm: %v\n", err)
		} else if form != nil && form.File["files"] != nil {
			fmt.Printf("Найдено %d дополнительных файлов\n", len(form.File["files"]))
			for i, fileHeader := range form.File["files"] {
				fmt.Printf("Обработка файла %d: %s, размер: %d\n", i+1, fileHeader.Filename, fileHeader.Size)
				file, err := hc.FileController.UploadFile(c, fileHeader, hackathon.ID, "hackathon")
				if err != nil {
					fmt.Printf("Ошибка при загрузке файла: %v\n", err)
					return err
				}
				fmt.Printf("Файл загружен, ID файла=%v\n", file.ID)

				// Добавляем файл в Files хакатона
				if err := tx.Model(&hackathon).Association("Files").Append(file); err != nil {
					fmt.Printf("Ошибка при связывании файла с хакатоном: %v\n", err)
					return err
				}
				fmt.Printf("Файл %d привязан к хакатону\n", i+1)
			}
		} else {
			fmt.Println("Дополнительные файлы не найдены")
		}

		// Добавляем технологии
		if len(dto.Technologies) > 0 {
			fmt.Printf("Добавление %d технологий\n", len(dto.Technologies))
			var technologies []models.Technology
			if err := tx.Where("id IN ?", dto.Technologies).Find(&technologies).Error; err != nil {
				fmt.Printf("Ошибка при поиске технологий: %v\n", err)
				return err
			}
			fmt.Printf("Найдено %d технологий в БД\n", len(technologies))

			if err := tx.Model(&hackathon).Association("Technologies").Append(&technologies); err != nil {
				fmt.Printf("Ошибка при связывании технологий с хакатоном: %v\n", err)
				return err
			}
			fmt.Println("Технологии привязаны к хакатону")
		} else {
			fmt.Println("Нет технологий для добавления")
		}

		// Создаем и связываем этапы хакатона
		if len(dto.Steps) > 0 {
			fmt.Printf("Создание %d этапов хакатона\n", len(dto.Steps))
			for i, stepDTO := range dto.Steps {
				step := models.HackathonStep{
					HackathonID: hackathon.ID,
					Name:        stepDTO.Name,
					Description: stepDTO.Description,
					StartDate:   stepDTO.StartDate,
					EndDate:     stepDTO.EndDate,
				}
				fmt.Printf("Создание этапа %d: %s, %s - %s\n", i+1, step.Name,
					step.StartDate.Format("2006-01-02"), step.EndDate.Format("2006-01-02"))

				if err := tx.Create(&step).Error; err != nil {
					fmt.Printf("Ошибка при создании этапа: %v\n", err)
					return err
				}
				fmt.Printf("Этап %d создан\n", i+1)
			}
		} else {
			fmt.Println("Нет этапов для создания")
		}

		// Создаем и связываем критерии оценки
		if len(dto.Criteria) > 0 {
			fmt.Printf("Создание %d критериев оценки\n", len(dto.Criteria))
			for i, criterionDTO := range dto.Criteria {
				criterion := models.Criteria{
					HackathonID: hackathon.ID,
					Name:        criterionDTO.Name,
					MinScore:    criterionDTO.MinScore,
					MaxScore:    criterionDTO.MaxScore,
				}
				fmt.Printf("Создание критерия %d: %s, мин=%v, макс=%v\n", i+1, criterion.Name, criterion.MinScore, criterion.MaxScore)

				if err := tx.Create(&criterion).Error; err != nil {
					fmt.Printf("Ошибка при создании критерия: %v\n", err)
					return err
				}
				fmt.Printf("Критерий %d создан\n", i+1)
			}
		} else {
			fmt.Println("Нет критериев для создания")
		}

		// Создаем и связываем награды
		if len(dto.Awards) > 0 {
			fmt.Printf("Создание %d наград\n", len(dto.Awards))
			for i, awardDTO := range dto.Awards {
				award := models.Award{
					HackathonID:  hackathon.ID,
					PlaceFrom:    awardDTO.PlaceFrom,
					PlaceTo:      awardDTO.PlaceTo,
					MoneyAmount:  awardDTO.MoneyAmount,
					Additionally: awardDTO.Additionally,
				}
				fmt.Printf("Создание награды %d: места %d-%d, сумма %.2f\n", i+1, award.PlaceFrom, award.PlaceTo, award.MoneyAmount)

				if err := tx.Create(&award).Error; err != nil {
					fmt.Printf("Ошибка при создании награды: %v\n", err)
					return err
				}
				fmt.Printf("Награда %d создана\n", i+1)
			}
		} else {
			fmt.Println("Нет наград для создания")
		}

		fmt.Println("Все операции в транзакции выполнены успешно")
		return nil
	})

	if err != nil {
		fmt.Printf("ОШИБКА ТРАНЗАКЦИИ: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	fmt.Println("Транзакция успешно завершена")

	// Загружаем полные данные хакатона для ответа
	fmt.Printf("Загрузка данных хакатона ID=%d для ответа\n", hackathon.ID)
	var result models.Hackathon
	if err := hc.DB.Preload("Organization").
		Preload("Logo").
		Preload("Files").
		Preload("Technologies").
		Preload("Steps").
		Preload("Criteria").
		Preload("Awards").
		First(&result, hackathon.ID).Error; err != nil {
		fmt.Printf("Ошибка при загрузке результата: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при загрузке данных хакатона: " + err.Error()})
		return
	}
	fmt.Println("Данные хакатона успешно загружены, отправка ответа")

	c.JSON(http.StatusCreated, result)
	fmt.Println("Запрос CreateHackathon успешно обработан")
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
	var dto hackathonDTO.HackathonUpdateDTO

	// Привязка JSON к DTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных", "details": err.Error()})
		return
	}

	// Извлечение ID хакатона из URL
	hackathonID := c.Param("hackathon_id")
	if hackathonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	var hackathon models.Hackathon
	tx := hc.DB.Begin()
	if err := tx.Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при начале транзакции"})
		return
	}

	// Поиск хакатона по ID
	if err := tx.First(&hackathon, hackathonID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Обновление полей хакатона
	hackathon = dto.ToModel(hackathon)

	// Удаление старых этапов, если переданы новые
	if len(dto.Steps) > 0 {
		if err := tx.Where("hackathon_id = ?", hackathon.ID).Delete(&models.HackathonStep{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении старых этапов", "details": err.Error()})
			return
		}

		// Создание новых этапов
		for _, step := range dto.Steps {
			stepModel := step.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
			if err := tx.Create(&stepModel).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании этапа", "details": err.Error()})
				return
			}
		}
	}

	// Удаление старых наград, если переданы новые
	if len(dto.Awards) > 0 {
		if err := tx.Where("hackathon_id = ?", hackathon.ID).Delete(&models.Award{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении старых наград", "details": err.Error()})
			return
		}

		// Создание новых наград
		for _, award := range dto.Awards {
			awardModel := award.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
			if err := tx.Create(&awardModel).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании награды", "details": err.Error()})
				return
			}
		}
	}

	if len(dto.Criteria) > 0 {
		if err := tx.Where("hackathon_id = ?", hackathon.ID).Delete(&models.Criteria{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении старых критериев", "details": err.Error()})
			return
		}

		for _, criteria := range dto.Criteria {
			criteiaModel := criteria.ToModel(hackathon.ID)
			if err := tx.Create(&criteiaModel).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании критериев", "details": err.Error()})
				return
			}
		}
	}

	// Сохранение обновленного хакатона
	if err := tx.Save(&hackathon).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении хакатона", "details": err.Error()})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при подтверждении транзакции"})
		return
	}

	c.JSON(http.StatusOK, hackathon)
}

func (hc *HackathonController) GetByIDFull(c *gin.Context) {
	id := c.Param("hackathon_id")
	var hackathon models.Hackathon

	if err := hc.DB.Preload("Logo").Preload("Users").Preload("Files").Preload("Teams").Preload("Steps").Preload("Technologies").Preload("Awards").Preload("Criteria").Preload("Organization").First(&hackathon, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	c.JSON(http.StatusOK, hackathon)
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
