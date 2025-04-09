package initializers

import "server/models"

func SyncDatabase() {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Hackathon{},
		&models.Team{},
		&models.Stage{},
		&models.Criterion{},
		&models.Technology{},
		&models.Reward{},
		&models.Sponsor{})

	if err != nil {
		return
	}
}
