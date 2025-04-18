package controllers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/types"
	"strconv"
)

type MentorInviteController struct {
	DB *gorm.DB
}

func NewInviteController(db *gorm.DB) *MentorInviteController {
	return &MentorInviteController{DB: db}
}

func (hc *MentorInviteController) InviteMentor(c *gin.Context) {
	// Извлечение ID хакатона из URL
	hackathonID := c.Param("hackathon_id")
	if hackathonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	// Проверка, существует ли хакатон
	var hackathon models.Hackathon
	if err := hc.DB.First(&hackathon, hackathonID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	mentorID := c.Param("mentor_id")
	if mentorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор ментора"})
		return
	}

	// Извлечение ID пользователя из claims
	claims := c.MustGet("user_claims").(*types.Claims)
	userID := claims.UserID

	// Преобразование mentorID из string в uint
	mentorIDUint, err := strconv.ParseUint(mentorID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный идентификатор ментора"})
		return
	}

	// Проверка, что пользователь не пытается пригласить себя
	if userID == uint(mentorIDUint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нельзя пригласить себя в качестве ментора"})
		return
	}

	// Проверка, существует ли пользователь-ментор
	var mentor models.User
	if err := hc.DB.First(&mentor, mentorIDUint).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь-ментор не найден"})
		return
	}

	// Проверка, существует ли уже приглашение для данного ментора на этот хакатон
	var existingInvite models.MentorInvite
	if err := hc.DB.Where("user_id = ? AND hackathon_id = ?", mentor.ID, hackathon.ID).First(&existingInvite).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Приглашение для этого ментора на данный хакатон уже отправлено"})
		return
	}

	// Создание приглашения для ментора
	invite := models.MentorInvite{
		UserID:      mentor.ID,
		HackathonID: hackathon.ID,
		Status:      0,
	}

	if err := hc.DB.Create(&invite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании приглашения", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Приглашение для ментора успешно отправлено"})
}

func (hc *MentorInviteController) GetMentorInvitations(c *gin.Context) {
	// Извлечение ID хакатона из URL
	hackathonID := c.Param("hackathon_id")
	if hackathonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	// Проверка, существует ли хакатон
	var hackathon models.Hackathon
	if err := hc.DB.First(&hackathon, hackathonID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Получение приглашений для текущего пользователя по ID хакатона
	var invitations []models.MentorInvite
	if err := hc.DB.Where("hackathon_id = ?", hackathon.ID).Find(&invitations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении приглашений", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invitations)
}

func (hc *MentorInviteController) AcceptMentorInvite(c *gin.Context) {
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
	var invite models.MentorInvite
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

	// Добавление ментора в хакатон с ролью 2
	hackathonID := invite.HackathonID

	mentorHackathon := models.BndUserHackathon{
		UserID:        userID,
		HackathonID:   hackathonID,
		HackathonRole: 2,
	}

	if err := hc.DB.Create(&mentorHackathon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при добавлении ментора в хакатон", "details": err.Error()})
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

func (hc *MentorInviteController) RejectMentorInvite(c *gin.Context) {
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
	var invite models.MentorInvite
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

func (hc *MentorInviteController) GetInvitesToMe(c *gin.Context) {
	// Извлечение ID пользователя из claims
	claims := c.MustGet("user_claims").(*types.Claims)
	userID := claims.UserID

	// Получение приглашений для указанного пользователя
	var invitations []models.MentorInvite
	if err := hc.DB.Where("user_id = ?", userID).Find(&invitations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении приглашений", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invitations)
}
