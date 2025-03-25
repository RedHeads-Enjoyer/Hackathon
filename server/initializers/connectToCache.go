package initializers

import (
	"context"
	"github.com/redis/go-redis/v9"
	"time"
)

var Cache *redis.Client

func ConnectToCache() {
	Cache = redis.NewClient(&redis.Options{
		Addr:     "redis:6379",
		Password: "",
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := Cache.Ping(ctx).Result(); err != nil {
		panic("Failed to connect to Redis: " + err.Error())
	}
}
