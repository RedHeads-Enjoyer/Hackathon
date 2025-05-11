package controllers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"log"
	"net/http"
	"reflect"
	"server/models"
	"server/models/DTO/teamInviteDTO"
	"server/types"
	"strconv"
)

type TeamInviteController struct {
	DB *gorm.DB
}

func NewTeamInviteController(db *gorm.DB) *TeamInviteController {
	return &TeamInviteController{DB: db}
}

func (hc *TeamInviteController) InviteUser(c *gin.Context) {
	fmt.Println("zxcqwe")
	// Установка восстановления после паники
	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC в InviteUser: %v", r)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
		}
	}()

	log.Printf("Начинаем выполнение InviteUser")
	log.Printf("Получены URL-параметры: hackathon_id=%s, user_id=%s", c.Param("hackathon_id"), c.Param("user_id"))

	// Получаем текущего пользователя из JWT-токена
	userClaims, exists := c.Get("user_claims")
	if !exists {
		log.Printf("Ошибка: user_claims отсутствует в контексте")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходима аутентификация"})
		c.Abort()
		return
	}

	claims, ok := userClaims.(*types.Claims)
	if !ok {
		log.Printf("Ошибка: не удалось привести user_claims к типу *types.Claims")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при извлечении данных пользователя"})
		c.Abort()
		return
	}
	log.Printf("Получены данные о текущем пользователе: UserID=%d", claims.UserID)

	// Извлечение ID хакатона и пользователя для приглашения из URL
	hackathonID := c.Param("hackathon_id")
	if hackathonID == "" {
		log.Printf("Ошибка: отсутствует hackathon_id")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	targetUserID := c.Param("user_id")
	if targetUserID == "" {
		log.Printf("Ошибка: отсутствует user_id")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор приглашаемого пользователя"})
		return
	}
	log.Printf("Извлечены параметры: hackathonID=%s, targetUserID=%s", hackathonID, targetUserID)

	// Проверка, существует ли хакатон
	var hackathon models.Hackathon
	if err := hc.DB.First(&hackathon, hackathonID).Error; err != nil {
		log.Printf("Ошибка: хакатон с ID=%s не найден: %v", hackathonID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}
	log.Printf("Хакатон найден: ID=%d, Name=%s", hackathon.ID, hackathon.Name)

	// Проверка, участвует ли текущий пользователь в хакатоне
	var currentUserHackathon models.BndUserHackathon
	if err := hc.DB.Where("user_id = ? AND hackathon_id = ?", claims.UserID, hackathonID).First(&currentUserHackathon).Error; err != nil {
		log.Printf("Ошибка: пользователь с ID=%d не участвует в хакатоне с ID=%s: %v", claims.UserID, hackathonID, err)
		c.JSON(http.StatusForbidden, gin.H{"error": "Вы не участвуете в данном хакатоне"})
		return
	}
	fmt.Println("Текущий пользователь участвует в хакатоне: UserID=%d, HackathonID=%d", currentUserHackathon.UserID, currentUserHackathon.HackathonID)

	// Проверка, участвует ли целевой пользователь в хакатоне
	var targetUserHackathon models.BndUserHackathon
	if err := hc.DB.Where("user_id = ? AND hackathon_id = ?", targetUserID, hackathonID).First(&targetUserHackathon).Error; err != nil {
		log.Printf("Ошибка: целевой пользователь с ID=%s не участвует в хакатоне с ID=%s: %v", targetUserID, hackathonID, err)
		c.JSON(http.StatusForbidden, gin.H{"error": "Приглашаемый пользователь не участвует в хакатоне"})
		return
	}
	fmt.Println("Целевой пользователь участвует в хакатоне: UserID=%d, HackathonID=%d", targetUserHackathon.UserID, targetUserHackathon.HackathonID)

	// Находим команду текущего пользователя в этом хакатоне
	var userTeamInfo struct {
		TeamID   uint
		TeamRole int
	}

	teamQuery := hc.DB.Model(&models.BndUserTeam{}).
		Select("bnd_user_teams.team_id, bnd_user_teams.team_role").
		Joins("JOIN teams ON bnd_user_teams.team_id = teams.id").
		Where("bnd_user_teams.user_id = ? AND teams.hackathon_id = ?", claims.UserID, hackathonID)

	fmt.Println("SQL запрос для поиска команды: %v", teamQuery.Statement.SQL.String())

	if err := teamQuery.First(&userTeamInfo).Error; err != nil {
		log.Printf("Ошибка: текущий пользователь не состоит в команде хакатона: %v", err)
		c.JSON(http.StatusForbidden, gin.H{"error": "Вы не состоите в команде этого хакатона"})
		return
	}
	log.Printf("Найдена команда пользователя: TeamID=%d, TeamRole=%d", userTeamInfo.TeamID, userTeamInfo.TeamRole)

	// Проверка, является ли текущий пользователь капитаном команды
	if userTeamInfo.TeamRole != 2 {
		log.Printf("Ошибка: пользователь не является капитаном команды (роль=%d)", userTeamInfo.TeamRole)
		c.JSON(http.StatusForbidden, gin.H{"error": "Только капитан команды может отправлять приглашения"})
		return
	}
	log.Printf("Пользователь является капитаном команды")

	// Проверка, есть ли у приглашаемого пользователя уже команда для этого хакатона
	var targetUserTeam models.BndUserTeam
	targetTeamQuery := hc.DB.Where("user_id = ? AND team_id IN (SELECT id FROM teams WHERE hackathon_id = ?)", targetUserID, hackathonID)
	log.Printf("SQL запрос для проверки команды целевого пользователя: %v", targetTeamQuery.Statement.SQL.String())

	if err := targetTeamQuery.First(&targetUserTeam).Error; err == nil {
		log.Printf("Ошибка: целевой пользователь уже в команде: TeamID=%d", targetUserTeam.TeamID)
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь уже состоит в команде для этого хакатона"})
		return
	}
	fmt.Println("Целевой пользователь не состоит в команде для этого хакатона")

	// Проверка, существует ли уже приглашение для этого пользователя в эту команду
	var existingInvite models.TeamInvite
	inviteQuery := hc.DB.Where("receiver_id = ? AND team_id = ? AND status = 0", targetUserID, userTeamInfo.TeamID)
	log.Printf("SQL запрос для проверки существования приглашения: %v", inviteQuery.Statement.SQL.String())

	if err := inviteQuery.First(&existingInvite).Error; err == nil {
		log.Printf("Ошибка: приглашение уже существует: ID=%d", existingInvite.ID)
		c.JSON(http.StatusConflict, gin.H{"error": "Приглашение уже отправлено этому пользователю"})
		return
	}
	log.Printf("Приглашение не существует, можно создать новое")

	// Вывод структуры таблицы TeamInvite для проверки полей
	log.Printf("Структура TeamInvite: %+v", reflect.TypeOf(models.TeamInvite{}).Field(0))

	// Создание приглашения
	invite := models.TeamInvite{
		TeamID: userTeamInfo.TeamID,
		UserID: targetUserHackathon.UserID,
		Status: 0,
	}
	log.Printf("Подготовлено новое приглашение: %+v", invite)

	if err := hc.DB.Create(&invite).Error; err != nil {
		log.Printf("Ошибка при создании приглашения: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании приглашения", "details": err.Error()})
		return
	}
	log.Printf("Приглашение успешно создано: ID=%d", invite.ID)

	c.JSON(http.StatusOK, gin.H{"message": "Приглашение успешно отправлено"})
	log.Printf("Метод InviteUser завершен успешно")
}

func (hc *TeamInviteController) AcceptTeamInvite(c *gin.Context) {
	// Извлечение ID приглашения из URL
	inviteID := c.Param("invite_id")
	if inviteID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор приглашения"})
		return
	}

	// Извлечение ID пользователя из claims
	claims := c.MustGet("user_claims").(*types.Claims)
	userID := claims.UserID

	// Проверка, существует ли приглашение
	var invite models.TeamInvite
	if err := hc.DB.First(&invite, inviteID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Приглашение не найдено"})
		return
	}

	// Проверка, что приглашение предназначено для текущего пользователя
	if invite.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет прав на принятие этого приглашения"})
		return
	}

	// Проверка статуса приглашения
	if invite.Status != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Приглашение уже принято или отклонено"})
		return
	}

	// Добавление пользователя в команду
	teamID := invite.TeamID
	bndUserTeam := models.BndUserTeam{
		UserID:   userID,
		TeamID:   teamID,
		TeamRole: 1, // Предположим, что 1 - это роль участника команды
	}

	if err := hc.DB.Create(&bndUserTeam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при добавлении пользователя в команду", "details": err.Error()})
		return
	}

	// Обновление статуса приглашения
	invite.Status = 1 // Статус 1 для принятого приглашения
	if err := hc.DB.Save(&invite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении статуса приглашения", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Приглашение принято"})
}

func (hc *TeamInviteController) RejectTeamInvite(c *gin.Context) {
	// Извлечение ID приглашения из URL
	inviteID := c.Param("invite_id")
	if inviteID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор приглашения"})
		return
	}

	// Извлечение ID пользователя из claims
	claims := c.MustGet("user_claims").(*types.Claims)
	userID := claims.UserID

	// Проверка, существует ли приглашение
	var invite models.TeamInvite
	if err := hc.DB.First(&invite, inviteID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Приглашение не найдено"})
		return
	}

	// Проверка, что приглашение предназначено для текущего пользователя
	if invite.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет прав на отклонение этого приглашения"})
		return
	}

	// Проверка статуса приглашения
	if invite.Status != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Приглашение уже принято или отклонено"})
		return
	}

	// Обновление статуса приглашения
	invite.Status = -1 // Статус -1 для отклоненного приглашения
	if err := hc.DB.Save(&invite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении статуса приглашения", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Приглашение отклонено"})
}

func (hc *TeamInviteController) GetTeamInvitesForMe(c *gin.Context) {
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

	// Получение приглашений для указанного пользователя в конкретном хакатоне
	var invitations []models.TeamInvite
	if err := hc.DB.Joins("JOIN teams ON team_invites.team_id = teams.id").
		Where("team_invites.user_id = ? AND teams.hackathon_id = ?", userID, hackathonID).
		Preload("Team").
		Find(&invitations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении приглашений", "details": err.Error()})
		return
	}

	result := make([]teamInviteDTO.Get, len(invitations))
	for i, invite := range invitations {
		result[i] = teamInviteDTO.Get{
			Id:        invite.ID,
			TeamName:  invite.Team.Name,
			Status:    invite.Status,
			CreatedAt: invite.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, result)
}

func (hc *TeamInviteController) GetTeamMembers(c *gin.Context) {
	// Извлечение ID команды из URL
	teamID := c.Param("team_id")
	if teamID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор команды"})
		return
	}

	// Проверка, существует ли команда
	var team models.Team
	if err := hc.DB.First(&team, teamID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Команда не найдена"})
		return
	}

	// Получение участников команды
	var members []models.BndUserTeam
	if err := hc.DB.Where("team_id = ?", team.ID).Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении участников команды", "details": err.Error()})
		return
	}

	// Формирование списка участников
	var memberList []gin.H
	for _, member := range members {
		memberList = append(memberList, gin.H{
			"user_id":   member.UserID,
			"team_id":   member.TeamID,
			"team_role": member.TeamRole,
			"user":      member.User,
		})
	}

	c.JSON(http.StatusOK, memberList)
}
