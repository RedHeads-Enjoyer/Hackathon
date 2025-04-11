package models

type Team struct {
	Base

	Project *File         `gorm:"polymorphic:Owner;polymorphicValue:tea,"`
	Users   []BndUserTeam `gorm:"foreignKey:TeamID" json:"-"`
}
