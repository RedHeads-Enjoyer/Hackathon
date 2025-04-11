package initializers

import (
	"gorm.io/gorm"
	"server/models"
)

func initSystemRoles(db *gorm.DB) error {
	systemRoles := []models.SystemRole{
		{Name: "admin", Description: "Полный доступ к системе", Level: 100},
		{Name: "moderator", Description: "Модератор контента", Level: 50},
		{Name: "user", Description: "Обычный пользователь", Level: 10},
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
		{Name: "creator", Description: "Создатель хакатона", Level: 100},
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
		&models.File{},
		&models.Hackathon{},
		&models.Team{},
		&models.User{},
		&models.BndUserHackathon{},
		&models.BndUserTeam{},
		&models.HackathonStep{},
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

}
