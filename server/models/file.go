package models

type File struct {
	Base
	Name         string `gorm:"size:255;not null"`
	StoredName   string `gorm:"size:255;not null"`
	URL          string `gorm:"size:512;not null"`
	Size         int64  `gorm:"not null"`
	Type         string `gorm:"size:100;not null"`
	UploadedByID uint   `gorm:"not null"`
	UploadedBy   User   `gorm:"foreignKey:UploadedByID"`

	// Полиморфные поля для связи с разными сущностями
	OwnerType string `gorm:"size:50"`
	OwnerID   uint
}
