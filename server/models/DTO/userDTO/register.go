package userDTO

type Register struct {
	Email    string `json:"email"    binding:"required,email"`
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}
