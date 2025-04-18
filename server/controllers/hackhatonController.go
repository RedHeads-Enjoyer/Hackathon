package controllers

import (
	"errors"
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
	dto := c.MustGet("hackathon_dto").(hackathonDTO.HackathonCreateDTO)

	// Валидация данных
	validate := validator.New()
	if err := validate.Struct(dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации", "details": err.Error()})
		return
	}

	// Извлечение ID организации из DTO или контекста
	organizationID := dto.OrganizationID // Предполагается, что у вас есть поле OrganizationID в DTO

	// Проверка статуса организации
	var organization models.Organization
	if err := hc.DB.First(&organization, organizationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
		return
	}

	if !organization.IsVerified {
		c.JSON(http.StatusForbidden, gin.H{"error": "Организация не имеет права создавать хакатоны"})
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
	if err := tx.Create(&hackathon).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании хакатона", "details": err.Error()})
		return
	}

	// Создание критериев
	for _, criteria := range dto.Criteria {
		criteriaModel := criteria.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
		if err := tx.Create(&criteriaModel).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании критерия", "details": err.Error()})
			return
		}
		hackathon.Criteria = append(hackathon.Criteria, criteriaModel)
	}

	// Создание шагов
	for _, step := range dto.Steps {
		stepModel := step.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
		if err := tx.Create(&stepModel).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании этапа", "details": err.Error()})
			return
		}

		hackathon.Steps = append(hackathon.Steps, stepModel)
	}

	// Создание наград
	for _, award := range dto.Awards {
		awardModel := award.ToModel(hackathon.ID) // Предполагается, что у вас есть метод ToModel
		if err := tx.Create(&awardModel).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании награды", "details": err.Error()})
			return
		}
		hackathon.Awards = append(hackathon.Awards, awardModel)
	}

	for _, techID := range dto.Technologies {
		var technology models.Technology
		if err := tx.First(&technology, techID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Технология не найдена", "details": err.Error()})
			tx.Rollback()
			return
		}

		// Связываем технологию с хакатоном
		if err := tx.Model(&hackathon).Association("Technologies").Append(&technology); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при связывании технологии с хакатоном", "details": err.Error()})
			return
		}
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

	// Проверка, не добавлен ли пользователь уже
	var existingUser models.BndUserHackathon
	if err := tx.Where("user_id = ? AND hackathon_id = ?", userID, hackathon.ID).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь уже добавлен к хакатону"})
		tx.Rollback()
		return
	}

	// Добавление пользователя к хакатону
	userHackathon := models.BndUserHackathon{
		UserID:        userID,
		HackathonID:   hackathon.ID,
		HackathonRole: 3,
	}

	if err := tx.Create(&userHackathon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при добавлении пользователя к хакатону", "details": err.Error()})
		tx.Rollback()
		return
	}

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
