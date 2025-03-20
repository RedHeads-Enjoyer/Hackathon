package initializers

import (
	"database/sql"
	"fmt"
	"github.com/joho/godotenv"
	"log"
	"os"

	_ "github.com/lib/pq" // Импортируем драйвер PostgreSQL
)

func ConnectToDb() *sql.DB {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Формируем строку подключения
	psqlconn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"), // Добавляем пароль
		os.Getenv("DB_NAME"),
	)

	// Подключаемся к базе данных
	db, err := sql.Open("postgres", psqlconn)
	if err != nil {
		log.Fatal("Error connecting to the database:", err)
	}

	// Проверяем подключение
	err = db.Ping()
	if err != nil {
		log.Fatal("Error pinging the database:", err)
	}

	fmt.Println("Successfully connected to the database!")
	return db
}
