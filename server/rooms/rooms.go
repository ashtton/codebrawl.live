package rooms

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"log"
	"strings"
	"time"

	"server/database"

	redis "github.com/redis/go-redis/v9"
)

const (
	roomKeyPrefix      = "room:"
	roomUsersKeyPrefix = "room:users:"
	userRoomKeyPrefix  = "user:room:"
	roomChannelPrefix  = "room:chan:"
)

type Room struct {
	Code      string          `json:"code"`
	Type      string          `json:"type"`  // ranked, casual, private
	State     string          `json:"state"` // lobby | in-game | ended
	MaxUsers  int             `json:"maxUsers"`
	GameState json.RawMessage `json:"gameState,omitempty"`
	UpdatedAt int64           `json:"updatedAt"`
}

func roomKey(code string) string       { return roomKeyPrefix + strings.ToUpper(code) }
func roomUsersKey(code string) string  { return roomUsersKeyPrefix + strings.ToUpper(code) }
func userRoomKey(userID string) string { return userRoomKeyPrefix + userID }
func roomChannel(code string) string   { return roomChannelPrefix + strings.ToUpper(code) }

func now() int64 { return time.Now().Unix() }

func generateCode(n int) (string, error) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no easily confused chars
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	for i := 0; i < n; i++ {
		b[i] = alphabet[int(b[i])%len(alphabet)]
	}
	return string(b), nil
}

func CreateRoom(ctx context.Context, roomType string, maxUsers int, creatorUserID string) (Room, error) {
	rdb := database.Client()
	if rdb == nil {
		return Room{}, errors.New("redis not configured")
	}
	if creatorUserID == "" {
		return Room{}, errors.New("missing user id")
	}
	if maxUsers <= 0 {
		maxUsers = 8
	}
	var code string
	for i := 0; i < 5; i++ { // a few attempts to avoid collisions
		c, err := generateCode(6)
		if err != nil {
			return Room{}, err
		}
		exists, err := rdb.Exists(ctx, roomKey(c)).Result()
		if err != nil {
			return Room{}, err
		}
		if exists == 0 {
			code = c
			break
		}
	}
	if code == "" {
		return Room{}, errors.New("unable to allocate room code")
	}
	r := Room{
		Code:      code,
		Type:      strings.ToLower(roomType),
		State:     "lobby",
		MaxUsers:  maxUsers,
		UpdatedAt: now(),
	}
	b, _ := json.Marshal(r)
	pipe := rdb.TxPipeline()
	pipe.Set(ctx, roomKey(code), b, 0)
	pipe.SAdd(ctx, roomUsersKey(code), creatorUserID)
	pipe.Set(ctx, userRoomKey(creatorUserID), code, 0)
	if _, err := pipe.Exec(ctx); err != nil {
		return Room{}, err
	}
	_ = publishState(ctx, r)
	return r, nil
}

func GetRoom(ctx context.Context, code string) (Room, []string, error) {
	rdb := database.Client()
	if rdb == nil {
		return Room{}, nil, errors.New("redis not configured")
	}
	b, err := rdb.Get(ctx, roomKey(code)).Bytes()
	if err == redis.Nil {
		return Room{}, nil, errors.New("room not found")
	}
	if err != nil {
		return Room{}, nil, err
	}
	var r Room
	if err := json.Unmarshal(b, &r); err != nil {
		return Room{}, nil, err
	}
	users, err := rdb.SMembers(ctx, roomUsersKey(code)).Result()
	if err != nil {
		return Room{}, nil, err
	}
	return r, users, nil
}

func AddUser(ctx context.Context, code, userID string) (Room, []string, error) {
	rdb := database.Client()
	if rdb == nil {
		return Room{}, nil, errors.New("redis not configured")
	}
	r, users, err := GetRoom(ctx, code)
	if err != nil {
		return Room{}, nil, err
	}
	if len(users) >= r.MaxUsers {
		return Room{}, nil, errors.New("room is full")
	}
	// Is user in another room? move them first (single active room assumption)
	if current, _ := rdb.Get(ctx, userRoomKey(userID)).Result(); current != "" && current != strings.ToUpper(code) {
		_, _, _ = RemoveUser(ctx, current, userID)
	}
	pipe := rdb.TxPipeline()
	pipe.SAdd(ctx, roomUsersKey(code), userID)
	pipe.Set(ctx, userRoomKey(userID), strings.ToUpper(code), 0)
	if _, err := pipe.Exec(ctx); err != nil {
		return Room{}, nil, err
	}
	_, users, err = GetRoom(ctx, code)
	if err != nil {
		return Room{}, nil, err
	}
	_ = publishState(ctx, r)
	return r, users, nil
}

func RemoveUser(ctx context.Context, code, userID string) (Room, []string, error) {
	rdb := database.Client()
	if rdb == nil {
		return Room{}, nil, errors.New("redis not configured")
	}
	_, err := rdb.SRem(ctx, roomUsersKey(code), userID).Result()
	if err != nil {
		return Room{}, nil, err
	}
	// clear user->room
	_ = rdb.Del(ctx, userRoomKey(userID)).Err()
	// if room empty, delete it
	cnt, err := rdb.SCard(ctx, roomUsersKey(code)).Result()
	if err == nil && cnt == 0 {
		_ = DeleteRoom(ctx, code)
		return Room{}, []string{}, nil
	}
	r, users, err := GetRoom(ctx, code)
	if err != nil {
		return Room{}, nil, err
	}
	_ = publishState(ctx, r)
	return r, users, nil
}

func UpdateState(ctx context.Context, code string, state string, gameState json.RawMessage) (Room, error) {
	rdb := database.Client()
	if rdb == nil {
		return Room{}, errors.New("redis not configured")
	}
	r, _, err := GetRoom(ctx, code)
	if err != nil {
		return Room{}, err
	}
	r.State = state
	r.GameState = gameState
	r.UpdatedAt = now()
	b, _ := json.Marshal(r)
	if err := rdb.Set(ctx, roomKey(code), b, 0).Err(); err != nil {
		return Room{}, err
	}
	_ = publishState(ctx, r)
	return r, nil
}

func DeleteRoom(ctx context.Context, code string) error {
	rdb := database.Client()
	if rdb == nil {
		return errors.New("redis not configured")
	}
	pipe := rdb.TxPipeline()
	pipe.Del(ctx, roomKey(code))
	pipe.Del(ctx, roomUsersKey(code))
	_, err := pipe.Exec(ctx)
	return err
}

func GetUserRoom(ctx context.Context, userID string) (string, error) {
	rdb := database.Client()
	if rdb == nil {
		return "", errors.New("redis not configured")
	}
	code, err := rdb.Get(ctx, userRoomKey(userID)).Result()
	if err == redis.Nil {
		return "", nil
	}
	return code, err
}

func IsMember(ctx context.Context, code, userID string) (bool, error) {
	rdb := database.Client()
	if rdb == nil {
		return false, errors.New("redis not configured")
	}
	res, err := rdb.SIsMember(ctx, roomUsersKey(code), userID).Result()
	return res, err
}

func publish(ctx context.Context, channel string, payload any) error {
	rdb := database.Client()
	if rdb == nil {
		return errors.New("redis not configured")
	}
	b, _ := json.Marshal(payload)
	return rdb.Publish(ctx, channel, b).Err()
}

func publishState(ctx context.Context, r Room) error {
	rdb := database.Client()
	var users []string
	if rdb != nil {
		if u, err := rdb.SMembers(ctx, roomUsersKey(r.Code)).Result(); err == nil {
			users = u
		}
	}
	msg := map[string]any{"type": "room:state", "room": r, "users": users}
	return publish(ctx, roomChannel(r.Code), msg)
}

func PublishChat(ctx context.Context, code, fromUserID, message string) error {
	rdb := database.Client()
	username := ""
	imageURL := ""
	if rdb != nil {
		if u, err := rdb.HGet(ctx, "usernames", fromUserID).Result(); err == nil {
			username = u
		}
		if img, err := rdb.HGet(ctx, "user_image_urls", fromUserID).Result(); err == nil {
			imageURL = img
		}
	}
	msg := map[string]any{
		"type":     "room:chat",
		"code":     strings.ToUpper(code),
		"from":     fromUserID,
		"message":  message,
		"ts":       now(),
		"username": username,
		"imageUrl": imageURL,
	}
	return publish(ctx, roomChannel(code), msg)
}

func Subscribe(ctx context.Context, code string, write func([]byte) error) error {
	rdb := database.Client()
	if rdb == nil {
		return errors.New("redis not configured")
	}
	chanName := roomChannel(code)
	pubsub := rdb.Subscribe(ctx, chanName)
	defer func() {
		_ = pubsub.Close()
	}()
	ch := pubsub.Channel()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case m, ok := <-ch:
			if !ok {
				return nil
			}
			if err := write([]byte(m.Payload)); err != nil {
				log.Println("room forward write error:", err)
				return err
			}
		}
	}
}
