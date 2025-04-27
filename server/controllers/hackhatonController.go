package controllers

import (
	"errors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/models/DTO/hackathonDTO"
	"server/models/DTO/teamDTO"
	"server/models/DTO/userDTO"
	"server/types"
	"strconv"
	"time"
)

type HackathonController struct {
	DB             *gorm.DB
	FileController *FileController
}

func NewHackathonController(db *gorm.DB) *HackathonController {
	return &HackathonController{DB: db}
}

// Создание хакатона
// CreateHackathon - метод для создания хакатона
func (hc *HackathonController) CreateHackathon(c *gin.Context) {
	// Получаем ID пользователя из контекста
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима авторизация"})
		return
	}

	// Получаем данные из формы
	var hackathonData struct {
		Name           string    `form:"name" binding:"required"`
		Description    string    `form:"description"`
		RegDateFrom    time.Time `form:"reg_date_from" binding:"required"`
		RegDateTo      time.Time `form:"reg_date_to" binding:"required"`
		StartDate      time.Time `form:"start_date" binding:"required"`
		EndDate        time.Time `form:"end_date" binding:"required"`
		MaxTeams       *int      `form:"max_teams"`
		MaxTeamSize    int       `form:"max_team_size" binding:"required"`
		MinTeamSize    int       `form:"min_team_size" binding:"required"`
		OrganizationID uint      `form:"organization_id" binding:"required"`
		TechnologyIDs  []uint    `form:"technology_ids"`
	}

	if err := c.ShouldBind(&hackathonData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем права на создание хакатона в этой организации
	var organization models.Organization
	if err := hc.DB.First(&organization, hackathonData.OrganizationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Организация не найдена"})
		return
	}

	if organization.OwnerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав для создания хакатона в этой организации"})
		return
	}

	// Создаем хакатон в транзакции
	var hackathon models.Hackathon
	err := hc.DB.Transaction(func(tx *gorm.DB) error {
		// Создаем запись хакатона
		hackathon = models.Hackathon{
			Name:           hackathonData.Name,
			Description:    hackathonData.Description,
			RegDateFrom:    hackathonData.RegDateFrom,
			RegDateTo:      hackathonData.RegDateTo,
			StartDate:      hackathonData.StartDate,
			EndDate:        hackathonData.EndDate,
			MaxTeams:       hackathonData.MaxTeams,
			MaxTeamSize:    hackathonData.MaxTeamSize,
			MinTeamSize:    hackathonData.MinTeamSize,
			StatusID:       1, // Начальный статус (например, "Черновик")
			OrganizationID: hackathonData.OrganizationID,
		}

		if err := tx.Create(&hackathon).Error; err != nil {
			return err
		}

		// Добавляем связь создателя хакатона как организатора
		userHackathon := models.BndUserHackathon{
			UserID:        userID.(uint),
			HackathonID:   hackathon.ID,
			HackathonRole: 3,
		}

		if err := tx.Create(&userHackathon).Error; err != nil {
			return err
		}

		// Загружаем логотип хакатона, если он есть
		logoFile, err := c.FormFile("logo")
		if err == nil && logoFile != nil {
			file, err := hc.FileController.UploadFile(c, logoFile, hackathon.ID, "hackathon")
			if err != nil {
				return err
			}

			// Обновляем хакатон с привязкой к логотипу
			if err := tx.Model(&hackathon).Association("Logo").Replace(file); err != nil {
				return err
			}
		}

		// Загружаем дополнительные файлы, если они есть
		form, err := c.MultipartForm()
		if err == nil && form != nil && form.File["files"] != nil {
			for _, fileHeader := range form.File["files"] {
				file, err := hc.FileController.UploadFile(c, fileHeader, hackathon.ID, "hackathon")
				if err != nil {
					return err
				}

				// Добавляем файл в Files хакатона
				if err := tx.Model(&hackathon).Association("Files").Append(file); err != nil {
					return err
				}
			}
		}

		// Добавляем технологии, если они указаны
		if len(hackathonData.TechnologyIDs) > 0 {
			var technologies []models.Technology
			if err := tx.Where("id IN ?", hackathonData.TechnologyIDs).Find(&technologies).Error; err != nil {
				return err
			}

			if err := tx.Model(&hackathon).Association("Technologies").Append(&technologies); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Загружаем полные данные хакатона для ответа
	var result models.Hackathon
	hc.DB.Preload("Organization").
		Preload("Logo").
		Preload("Files").
		Preload("Technologies").
		First(&result, hackathon.ID)

	c.JSON(http.StatusCreated, result)
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
