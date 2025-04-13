package types

import (
	"github.com/golang-jwt/jwt/v5"
	"server/models"
)

type Claims struct {
	UserID     uint              `json:"user_id"`
	Username   string            `json:"username"`
	SystemRole models.SystemRole `json:"systemRoleId"`
	*jwt.RegisteredClaims
}
