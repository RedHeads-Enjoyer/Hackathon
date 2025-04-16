package controllers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/types"
)

type InviteController struct {
	DB             *gorm.DB
	FileController *FileController
}

func NewInviteController(db *gorm.DB) *InviteController {
	return &InviteController{DB: db}
}

func (hc *InviteController) InviteMentor(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

	// Проверка, существует ли пользователь-ментор
	var mentor models.User
	if err := hc.DB.First(&mentor, mentorID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь-ментор не найден"})
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

func (hc *InviteController) GetMentorInvitations(c *gin.Context) {
	// Извлечение ID хакатона из URL
	hackathonID := c.Param("id")
	if hackathonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отсутствует идентификатор хакатона"})
		return
	}

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

	// Проверка, существует ли хакатон
	var hackathon models.Hackathon
	if err := hc.DB.First(&hackathon, hackathonID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Получение приглашений для текущего пользователя по ID хакатона
	var invitations []models.MentorInvite
	if err := hc.DB.Where("hackathon_id = ? AND user_id = ?", hackathon.ID, userID).Find(&invitations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении приглашений", "details": err.Error()})
		return
	}

	if len(invitations) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Приглашения не найдены для данного хакатона"})
		return
	}

	c.JSON(http.StatusOK, invitations)
}
