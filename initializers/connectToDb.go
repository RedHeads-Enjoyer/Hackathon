package initializers

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
	"os"
)

var DB *sql.DB

func ConnectToDb() {
	var err error

	// Формируем строку подключения
	psql := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	DB, err = sql.Open("postgres", psql)
	if err != nil {
		panic(fmt.Sprintf("failed to connect to database: %v", err))
	}

	// Проверяем соединение с базой данных
	err = DB.Ping()
	if err != nil {
		panic(fmt.Sprintf("failed to ping database: %v", err))
	}

	fmt.Println("Successfully connected to the database!")
}
