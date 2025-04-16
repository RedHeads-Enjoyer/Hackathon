package userDTO

import "server/models"

type UserUpdateDTO struct {
	Email    *string `json:"email"`
	Username *string `json:"username"`
}

func (dto *UserUpdateDTO) ToModel(existingUser models.User) models.User {
	if dto.Email != nil {
		existingUser.Email = *dto.Email
	}

	if dto.Username != nil {
		existingUser.Username = *dto.Username
	}

	return existingUser
}
