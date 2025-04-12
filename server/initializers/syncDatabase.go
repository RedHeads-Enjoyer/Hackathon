package initializers

import (
	"gorm.io/gorm"
	"server/models"
)

func initSystemRoles(db *gorm.DB) error {
	systemRoles := []models.SystemRole{
		{Name: "user", Description: "Обычный пользователь", Level: 10},
		{Name: "moderator", Description: "Модератор контента", Level: 50},
		{Name: "admin", Description: "Полный доступ к системе", Level: 100},
	}

	return db.Transaction(func(tx *gorm.DB) error {
		for _, role := range systemRoles {
			if err := tx.FirstOrCreate(&role, "name = ?", role.Name).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func initHackathonRoles(db *gorm.DB) error {
	hackathonRoles := []models.HackathonRole{
		{Name: "mentor", Description: "Ментор", Level: 50},
		{Name: "participant", Description: "Участник", Level: 10},
	}

	return db.Transaction(func(tx *gorm.DB) error {
		for _, role := range hackathonRoles {
			if err := tx.FirstOrCreate(&role, "name = ?", role.Name).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func initHackathonStatuses(db *gorm.DB) error {
	hackathonStatuses := []models.HackathonStatus{
		{Name: "Черновик", Description: "Хакатон находится на стадии создания"},
		{Name: "Активен", Description: "Хакатон создан и доступен пользователям"},
		{Name: "Завершен", Description: "Хакатон завершен"},
		{Name: "Заблокирован", Description: "Хакатон не доступен пользователям в связи с блокировкой"},
	}

	return db.Transaction(func(tx *gorm.DB) error {
		for _, status := range hackathonStatuses {
			if err := tx.FirstOrCreate(&status, "name = ?", status.Name).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func SyncDatabase() {
	// Отключаем ограничения внешних ключей для избежания проблем с порядком
	if err := DB.Exec("SET CONSTRAINTS ALL DEFERRED").Error; err != nil {
		return
	}

	// Миграция в правильном порядке
	modelsOrder := []interface{}{
		&models.SystemRole{},
		&models.HackathonRole{},
		&models.TeamRole{},
		&models.ChatRole{},
		&models.ChatMessage{},
		&models.Chat{},
		&models.File{},
		&models.Hackathon{},
		&models.Team{},
		&models.User{},
		&models.BndUserHackathon{},
		&models.BndUserTeam{},
		&models.HackathonStep{},
		&models.Award{},
		&models.Criteria{},
		&models.Technology{},
		&models.BndUserChat{},
		&models.HackathonGoal{},
		&models.Score{},
		&models.HackathonStatus{},
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

	// Инициализация ролей
	if err := initSystemRoles(DB); err != nil {
		return
	}

	if err := initHackathonRoles(DB); err != nil {
		return
	}

	if err := initHackathonStatuses(DB); err != nil {
		return
	}

}
