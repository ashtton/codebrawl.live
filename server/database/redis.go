package database

import (
	"context"
	"log"
	"os"
	"strings"

	"server/config"

	redis "github.com/redis/go-redis/v9"
)

var rdb *redis.Client

func InitRedis(ctx context.Context) error {
	if config.RedisURL == "" {
		config.RedisURL = os.Getenv("REDIS_URL")
	}

	opt, err := redis.ParseURL(config.RedisURL)
	if err != nil {
		if !strings.Contains(config.RedisURL, ":") {
			return err
		}
		rdb = redis.NewClient(&redis.Options{Addr: config.RedisURL})
	} else {
		rdb = redis.NewClient(opt)
	}

	if rdb != nil {
		if err := rdb.Ping(ctx).Err(); err != nil {
			return err
		}
		log.Println("Redis connected")
	}
	return nil
}

func Client() *redis.Client {
	return rdb
}

func Close() error {
	if rdb != nil {
		return rdb.Close()
	}
	return nil
}
