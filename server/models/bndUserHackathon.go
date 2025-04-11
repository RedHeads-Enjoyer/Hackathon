package models

type BndUserHackathon struct {
	UserID      uint `gorm:"primaryKey"`
	HackathonID uint `gorm:"primaryKey"`
	RoleID      uint `gorm:"not null"`

	User      User          `gorm:"foreignKey:UserID"`
	Hackathon Hackathon     `gorm:"foreignKey:HackathonID"`
	Role      HackathonRole `gorm:"foreignKey:RoleID"`
}
