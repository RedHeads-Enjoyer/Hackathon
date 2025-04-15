package initializers

import (
	"server/models"
)

func SyncDatabase() {
	// Отключаем ограничения внешних ключей для избежания проблем с порядком
	if err := DB.Exec("SET CONSTRAINTS ALL DEFERRED").Error; err != nil {
		return
	}

	// Миграция в правильном порядке
	modelsOrder := []interface{}{
		&models.ChatMessage{},
		&models.Chat{},
		&models.File{},
		&models.Hackathon{},
		&models.Team{},
		&models.User{},
		&models.BndUserHackathon{},
		&models.HackathonStep{},
		&models.Award{},
		&models.Criteria{},
		&models.Technology{},
		&models.Score{},
		&models.TeamInvite{},
		&models.MentorInvite{},
	}

	for _, model := range modelsOrder {
		if err := DB.AutoMigrate(model); err != nil {
			return
		}
	}

	// Включаем ограничения обратно
	if err := DB.Exec("SET CONSTRAINTS ALL IMMEDIATE").Error; err != nil {
		return
	}
}
