package main

import (
	"github.com/gin-gonic/gin"
	"hackathon/controllers"
	"hackathon/initializers"
)

func init() {
	initializers.LoadEnvVariables()
	initializers.ConnectToDb()
}

func main() {
	r := gin.Default()
	r.POST("/signup", controllers.Signup)
	r.Run()
}
