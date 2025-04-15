package models

import "gorm.io/gorm"

type File struct {
	gorm.Model
	Name         string `gorm:"size:255;not null"`
	StoredName   string `gorm:"size:255;not null"`
	URL          string `gorm:"size:512;not null"`
	Size         int64  `gorm:"not null"`
	Type         string `gorm:"size:100;not null"`
	UploadedByID uint   `gorm:"not null"`
	UploadedBy   *User  `gorm:"foreignKey:UploadedByID"`

	OwnerType string `gorm:"size:50"`
	OwnerID   uint
}
