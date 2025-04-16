package DTO

import "server/models"

type AwardCreateDTO struct {
	PlaceFrom    int     `json:"place_from" validate:"required,min=1"`
	PlaceTo      int     `json:"place_to" validate:"required,min=1,gtefield=PlaceFrom"`
	MoneyAmount  float64 `json:"money_amount" validate:"required,min=0"`
	Additionally string  `json:"additionally" validate:"max=500"`
}

func (dto *AwardCreateDTO) ToModel(hackathonID uint) *models.Award {
	return &models.Award{
		MoneyAmount:  dto.MoneyAmount,
		Additionally: dto.Additionally,
		PlaceFrom:    dto.PlaceFrom,
		PlaceTo:      dto.PlaceTo,
		HackathonID:  hackathonID,
	}
}
