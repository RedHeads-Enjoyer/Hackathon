package types

import (
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID     uint   `json:"id"`
	Username   string `json:"username"`
	SystemRole int    `json:"systemRole"`
	*jwt.RegisteredClaims
}
