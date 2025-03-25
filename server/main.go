package main

import (
	"log"
	"os"
	"server/initializers"
	"server/routers"
)

func init() {
	initializers.ConnectToDb()
	initializers.ConnectToCache()
	initializers.SyncDatabase()
}

func main() {
	router := routers.SetupRouter()

	port := os.Getenv("SERVER_PORT")

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
