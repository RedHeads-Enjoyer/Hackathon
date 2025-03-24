package main

import (
	"log"
	"os"
	initializers2 "server/initializers"
	"server/routers"
)

func init() {
	initializers2.LoadEnvVariables()
	initializers2.ConnectToDb()
}

func main() {
	router := routers.SetupRouter()

	port := os.Getenv("SERVER_PORT")

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
