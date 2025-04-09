package initializers

import (
	"server/models"
)

func SyncDatabase() {
	err := DB.AutoMigrate(
		&models.User{})
	if err != nil {
		return
	}
}
