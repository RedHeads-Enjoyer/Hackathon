package controllers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/types"
)

type TeamInviteController struct {
	DB *gorm.DB
}

func NewTeamInviteController(db *gorm.DB) *TeamInviteController {
	return &TeamInviteController{DB: db}
}

func (hc *TeamInviteController) InviteUser(c *gin.Context) {
	// Извлечение ID хакатона, команды и пользователя из URL
	hackathonID := c.Param("hackathon_id")
	if hackathonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	teamID := c.Param("team_id")
	if teamID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор команды"})
		return
	}

	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор пользователя"})
		return
	}

	// Проверка, существует ли хакатон
	var hackathon models.Hackathon
	if err := hc.DB.First(&hackathon, hackathonID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Проверка, существует ли команда
	var team models.Team
	if err := hc.DB.First(&team, teamID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Команда не найдена"})
		return
	}

	// Проверка, участвует ли пользователь в хакатоне
	var userHackathon models.BndUserHackathon
	if err := hc.DB.Where("user_id = ? AND hackathon_id = ?", userID, hackathonID).First(&userHackathon).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Пользователь не участвует в хакатоне"})
		return
	}

	// Проверка роли пользователя
	if userHackathon.HackathonRole != 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Пользователь не имеет права отправлять приглашения"})
		return
	}

	// Проверка, есть ли у пользователя уже команда для этого хакатона
	var userTeam models.BndUserTeam
	if err := hc.DB.Where("user_id = ? AND team_id IN (SELECT id FROM teams WHERE hackathon_id = ?)", userID, hackathonID).First(&userTeam).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь уже состоит в команде для этого хакатона"})
		return
	}

	// Создание приглашения
	invite := models.TeamInvite{
		UserID: userHackathon.UserID,
		TeamID: team.ID,
		Status: 0,
	}

	if err := hc.DB.Create(&invite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании приглашения", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Приглашение успешно отправлено"})
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

	// Получение приглашений для указанного пользователя
	var invitations []models.TeamInvite
	if err := hc.DB.Where("user_id = ?", userID).Preload("Team").Preload("User").Find(&invitations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении приглашений", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invitations)
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
