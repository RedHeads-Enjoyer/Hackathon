package controllers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
	"net/http"
	"server/models"
	"server/models/DTO/chatMessageDTO"
	"server/types"
	"strconv"
	"sync"
)

type ChatController struct {
	DB        *gorm.DB
	upgrader  websocket.Upgrader
	clients   map[uint]map[*websocket.Conn]bool
	clientsMu sync.Mutex
}

func NewChatController(db *gorm.DB) *ChatController {
	return &ChatController{
		DB: db,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		clients: make(map[uint]map[*websocket.Conn]bool),
	}
}

// WebSocketHandler обрабатывает websocket-соединения
func (cc *ChatController) WebSocketHandler(c *gin.Context) {
	chatID, err := strconv.ParseUint(c.Param("chat_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID чата"})
		return
	}

	fmt.Println("ПОЛУЧЕН ЗАПРОС НА WEBSOCKET")
	fmt.Println("URL:", c.Request.URL.String())
	fmt.Println("Заголовки:", c.Request.Header)

	// Проверка токена
	token := c.Query("token")
	fmt.Println("Полученный токен:", token)

	// Получаем пользователя из токена
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

	// Используем поле UserID вместо ID
	userID := claims.UserID

	// Проверяем права доступа (на ЧТЕНИЕ)
	hasAccess, err := cc.checkChatAccess(userID, uint(chatID), false)
	if err != nil || !hasAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав на чтение сообщений из этого чата"})
		return
	}

	// ТОЛЬКО ОДИН АПГРЕЙД СОЕДИНЕНИЯ
	conn, err := cc.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println("ОШИБКА АПГРЕЙДА:", err)
		return
	}

	fmt.Println("СОЕДИНЕНИЕ УСПЕШНО УСТАНОВЛЕНО")

	// Регистрируем клиента
	cc.clientsMu.Lock()
	if _, ok := cc.clients[uint(chatID)]; !ok {
		cc.clients[uint(chatID)] = make(map[*websocket.Conn]bool)
	}
	cc.clients[uint(chatID)][conn] = true
	cc.clientsMu.Unlock()

	// Запускаем обработчик сообщений
	go cc.handleMessages(conn, uint(chatID), userID)
}

// handleMessages обрабатывает сообщения от клиента
func (cc *ChatController) handleMessages(conn *websocket.Conn, chatID uint, userID uint) {
	hasWriteAccess, _ := cc.checkChatAccess(userID, chatID, true)

	defer func() {
		// Удаляем клиента при закрытии соединения
		cc.clientsMu.Lock()
		delete(cc.clients[chatID], conn)
		cc.clientsMu.Unlock()
		conn.Close()
	}()

	for {
		var msg struct {
			Content string `json:"content"`
		}

		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Println("Ошибка чтения сообщения:", err)
			break
		}

		// Если у пользователя нет прав на запись, отправляем ошибку
		if !hasWriteAccess {
			conn.WriteJSON(gin.H{"error": "Нет прав на отправку сообщений в этот чат"})
			continue
		}

		fmt.Printf("Получено сообщение от пользователя %d: %s\n", userID, msg.Content)

		// Проверяем доступ (на всякий случай)
		hasAccess, _ := cc.checkChatAccess(userID, chatID, true)
		if !hasAccess {
			conn.WriteJSON(gin.H{"error": "Нет прав на отправку сообщений"})
			continue
		}

		// Сохраняем сообщение в БД
		chatMessage := models.ChatMessage{
			Content: msg.Content,
			UserID:  userID, // Используем ID из токена, а не из сообщения
			ChatID:  chatID,
		}

		if err := cc.DB.Create(&chatMessage).Error; err != nil {
			fmt.Println("Ошибка сохранения сообщения:", err)
			conn.WriteJSON(gin.H{"error": "Ошибка сохранения сообщения"})
			continue
		}

		// Загружаем информацию о пользователе для отправки
		if err := cc.DB.Preload("User").First(&chatMessage, chatMessage.ID).Error; err != nil {
			fmt.Println("Ошибка загрузки информации о пользователе:", err)
			continue
		}

		fmt.Printf("Сообщение сохранено (ID: %d) и готово к отправке\n", chatMessage.ID)

		// Отправляем сообщение всем подключенным клиентам
		cc.broadcastMessage(chatID, chatMessage)
	}
}

// broadcastMessage отправляет сообщение всем клиентам в чате
func (cc *ChatController) broadcastMessage(chatID uint, message models.ChatMessage) {
	cc.clientsMu.Lock()
	clients := cc.clients[chatID]
	cc.clientsMu.Unlock()

	// Преобразуем модель в DTO перед отправкой
	messageDTO := chatMessageDTO.ConvertToMessageDTO(message)

	fmt.Printf("Отправка сообщения %d всем клиентам (%d) в чате %d\n",
		message.ID, len(clients), chatID)

	for client := range clients {
		err := client.WriteJSON(messageDTO)
		if err != nil {
			fmt.Println("Ошибка отправки сообщения клиенту:", err)
		}
	}
}

func (cc *ChatController) GetAvailableChats(c *gin.Context) {
	hackathonID, err := strconv.ParseUint(c.Param("hackathon_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID хакатона"})
		return
	}

	// Получаем пользователя из токена
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

	// Используем поле UserID вместо ID
	userID := claims.UserID

	// Структура для ответа с дополнительными полями
	type ChatResponse struct {
		ID     uint   `json:"id"`
		Type   int    `json:"type"`
		TeamID *uint  `json:"team_id,omitempty"`
		Name   string `json:"name"`
	}

	var chatResponses []ChatResponse

	// Получаем информацию о хакатоне
	var hackathon models.Hackathon
	if err := cc.DB.First(&hackathon, hackathonID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Хакатон не найден"})
		return
	}

	// Получаем общий чат хакатона (тип 1)
	var generalChats []models.Chat
	if err := cc.DB.Where("hackathon_id = ? AND type = 1", hackathonID).Find(&generalChats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении чатов"})
		return
	}

	for _, chat := range generalChats {
		chatResponses = append(chatResponses, ChatResponse{
			ID:     chat.ID,
			Type:   chat.Type,
			TeamID: chat.TeamID,
			Name:   "Общий чат",
		})
	}

	// Получаем чат организаторов (тип 2)
	var userHackathon models.BndUserHackathon
	if err := cc.DB.Where("user_id = ? AND hackathon_id = ?", userID, hackathonID).First(&userHackathon).Error; err == nil {
		// Все участники могут видеть чат организаторов (но писать только роли 2-3)
		var organizerChats []models.Chat
		if err := cc.DB.Where("hackathon_id = ? AND type = 2", hackathonID).Find(&organizerChats).Error; err == nil {
			for _, chat := range organizerChats {
				chatResponses = append(chatResponses, ChatResponse{
					ID:     chat.ID,
					Type:   chat.Type,
					TeamID: chat.TeamID,
					Name:   "Чат организаторов",
				})
			}
		}

		// Проверяем роль пользователя
		if userHackathon.HackathonRole >= 2 {
			// Для ролей 2 и 3 получаем ВСЕ командные чаты
			var allTeams []models.Team
			if err := cc.DB.Where("hackathon_id = ?", hackathonID).Find(&allTeams).Error; err == nil {
				for _, team := range allTeams {
					var teamChats []models.Chat
					if err := cc.DB.Where("hackathon_id = ? AND team_id = ? AND type = 3",
						hackathonID, team.ID).Find(&teamChats).Error; err == nil {
						for _, chat := range teamChats {
							chatResponses = append(chatResponses, ChatResponse{
								ID:     chat.ID,
								Type:   chat.Type,
								TeamID: chat.TeamID,
								Name:   "Чат команды " + team.Name,
							})
						}
					}
				}
			}
		} else {
			// Для обычных пользователей - только чаты их команд
			var userTeam models.BndUserTeam
			if err := cc.DB.Where("user_id = ? AND team_id IN (SELECT id FROM teams WHERE hackathon_id = ?)",
				userID, hackathonID).First(&userTeam).Error; err == nil {

				// Получаем информацию о команде для названия чата
				var team models.Team
				if err := cc.DB.First(&team, userTeam.TeamID).Error; err == nil {
					var teamChats []models.Chat
					if err := cc.DB.Where("hackathon_id = ? AND team_id = ? AND type = 3",
						hackathonID, userTeam.TeamID).Find(&teamChats).Error; err == nil {
						for _, chat := range teamChats {
							chatResponses = append(chatResponses, ChatResponse{
								ID:     chat.ID,
								Type:   chat.Type,
								TeamID: chat.TeamID,
								Name:   "Чат команды " + team.Name,
							})
						}
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"chats":          chatResponses,
		"hackathon_name": hackathon.Name,
	})
}

// Получение истории сообщений
func (cc *ChatController) GetChatMessages(c *gin.Context) {
	chatID, err := strconv.ParseUint(c.Param("chat_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID чата"})
		return
	}

	// Получаем пользователя из токена
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

	// Используем поле UserID вместо ID
	userID := claims.UserID

	// Проверяем права доступа (на чтение)
	hasAccess, err := cc.checkChatAccess(userID, uint(chatID), false) // false = проверка на чтение
	if err != nil || !hasAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав на чтение сообщений из этого чата"})
		return
	}

	limit := 50
	offset := 0

	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	var messages []models.ChatMessage
	if err := cc.DB.Where("chat_id = ?", chatID).
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении сообщений"})
		return
	}

	// Преобразуем все сообщения в DTO
	messagesDTO := make([]chatMessageDTO.Get, len(messages))
	for i, msg := range messages {
		messagesDTO[i] = chatMessageDTO.ConvertToMessageDTO(msg)
	}

	c.JSON(http.StatusOK, gin.H{"messages": messagesDTO})
}

// Проверка прав доступа к чату
func (cc *ChatController) checkChatAccess(userID uint, chatID uint, isWriteAccess bool) (bool, error) {
	var chat models.Chat
	if err := cc.DB.First(&chat, chatID).Error; err != nil {
		return false, err
	}

	// Проверка наличия пользователя в хакатоне
	var userHackathon models.BndUserHackathon
	err := cc.DB.Where("user_id = ? AND hackathon_id = ?", userID, chat.HackathonID).
		First(&userHackathon).Error

	if err != nil {
		return false, nil // Пользователь не участвует в хакатоне
	}

	switch chat.Type {
	case 1: // Общий чат - все могут читать и писать
		return true, nil

	case 2: // Организаторский чат - все могут читать, писать только роли 2 и 3
		if isWriteAccess {
			// Для записи нужна роль 2 или 3
			return userHackathon.HackathonRole >= 2, nil
		}
		// Для чтения доступно всем участникам
		return true, nil

	case 3: // Командный чат - читать и писать могут участники команды и роли 2-3
		// Роли 2-3 имеют полный доступ
		if userHackathon.HackathonRole >= 2 {
			return true, nil
		}

		// Проверяем, состоит ли пользователь в этой команде
		var userTeam models.BndUserTeam
		teamErr := cc.DB.Where("user_id = ? AND team_id = ?", userID, *chat.TeamID).
			First(&userTeam).Error

		return teamErr == nil, nil
	}

	return false, nil
}
