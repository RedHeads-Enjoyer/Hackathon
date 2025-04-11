package initializers

import (
	"gorm.io/gorm"
	"server/models"
)

func InitSystemRoles(db *gorm.DB) error {
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

func InitHackathonRoles(db *gorm.DB) error {
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
	err := DB.AutoMigrate(
		&models.User{})
	if err != nil {
		return
	}

	err = InitSystemRoles(DB)
	if err != nil {
		return
	}

	err = InitHackathonRoles(DB)
	if err != nil {
		return
	}
}
