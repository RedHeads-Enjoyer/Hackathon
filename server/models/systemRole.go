package models

import "gorm.io/gorm"

type SystemRole struct {
	Base
	Name        string `gorm:"size:50;unique;not null" json:"name"`
	Description string `gorm:"size:255" json:"description"`
	Level       uint   `gorm:"default:0" json:"level"`
}

func GetRoleByID(db *gorm.DB, id uint) (SystemRole, error) {
	var role SystemRole
	if err := db.First(&role, id).Error; err != nil {
		return role, err
	}
	return role, nil
}
