package events

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"strings"

	"server/config"
	"server/connections"
	"server/rooms"
	"server/database"

	"github.com/gorilla/websocket"
)

func init() {
	Register("room:create", roomCreate)
	Register("room:join", roomJoin)
	Register("room:leave", roomLeave)
	Register("room:chat", roomChat)
	Register("room:state", roomState)
	Register("room:start", roomStart)
}

type roomCreateMsg struct {
	Type     string `json:"type"`
	RoomType string `json:"roomType"`
	MaxUsers int    `json:"maxUsers"`
}

type roomJoinMsg struct {
	Type string `json:"type"`
	Code string `json:"code"`
}

type roomChatMsg struct {
	Type    string `json:"type"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

type roomStartMsg struct {
	Type      string          `json:"type"`
	Code      string          `json:"code"`
	GameState json.RawMessage `json:"gameState"`
}

func authedUser(c *Context) (string, error) {
	e, ok := c.Registry.Get(c.SocketID)
	if !ok || e.UserID == "" {
		return "", errors.New("unauthorized")
	}
	return e.UserID, nil
}

func writeJSON(conn *websocket.Conn, v any) {
	_ = SafeWriteJSON(conn, v)
}

func startSubscription(ctx context.Context, conn *websocket.Conn, code string) {
	go func() {
		w := func(b []byte) error {
			return SafeWriteMessage(conn, b)
		}
		if err := rooms.Subscribe(ctx, code, w); err != nil {
			log.Println("room subscription ended:", err)
		}
	}()
}

func roomCreate(c *Context) (bool, error) {
	var msg roomCreateMsg
	_ = json.Unmarshal(c.Raw, &msg)
	userID, err := authedUser(c)
	if err != nil {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": "unauthorized"})
		return true, nil
	}
	max := msg.MaxUsers
	if max <= 0 {
		if config.RoomMaxUsers > 0 {
			max = config.RoomMaxUsers
		} else {
			max = 8
		}
	}
	r, err := rooms.CreateRoom(c.Ctx, msg.RoomType, max, userID)
	if err != nil {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": err.Error()})
		return true, nil
	}
	startSubscription(c.Ctx, c.Conn, r.Code)
	writeJSON(c.Conn, map[string]any{"type": "room:created", "room": r})
	return true, nil
}

func roomJoin(c *Context) (bool, error) {
	var msg roomJoinMsg
	_ = json.Unmarshal(c.Raw, &msg)
	userID, err := authedUser(c)
	if err != nil {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": "unauthorized"})
		return true, nil
	}
	code := strings.ToUpper(msg.Code)
	r, users, err := rooms.AddUser(c.Ctx, code, userID)
	if err != nil {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": err.Error()})
		return true, nil
	}
	startSubscription(c.Ctx, c.Conn, r.Code)
	// Enrich users with username and imageUrl from Redis when available
	rdb := database.Client()
	enriched := make([]map[string]string, 0, len(users))
	for _, uid := range users {
		username := ""
		imageURL := ""
		if rdb != nil {
			if u, err := rdb.HGet(c.Ctx, "usernames", uid).Result(); err == nil {
				username = u
			}
			if img, err := rdb.HGet(c.Ctx, "user_image_urls", uid).Result(); err == nil {
				imageURL = img
			}
		}
		enriched = append(enriched, map[string]string{"userId": uid, "username": username, "imageUrl": imageURL})
	}
	writeJSON(c.Conn, map[string]any{"type": "room:joined", "room": r, "users": enriched})
	return true, nil
}

func roomLeave(c *Context) (bool, error) {
	var msg roomJoinMsg
	_ = json.Unmarshal(c.Raw, &msg)
	userID, err := authedUser(c)
	if err != nil {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": "unauthorized"})
		return true, nil
	}
	code := strings.ToUpper(msg.Code)
	r, users, err := rooms.RemoveUser(c.Ctx, code, userID)
	if err != nil {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": err.Error()})
		return true, nil
	}
	writeJSON(c.Conn, map[string]any{"type": "room:left", "room": r, "users": users})
	return true, nil
}

func roomChat(c *Context) (bool, error) {
	var msg roomChatMsg
	_ = json.Unmarshal(c.Raw, &msg)
	userID, err := authedUser(c)
	if err != nil {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": "unauthorized"})
		return true, nil
	}
	code := strings.ToUpper(msg.Code)
	isMember, _ := rooms.IsMember(c.Ctx, code, userID)
	if !isMember {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": "not a member"})
		return true, nil
	}
	if strings.TrimSpace(msg.Message) == "" {
		return true, nil
	}
	_ = rooms.PublishChat(c.Ctx, code, userID, msg.Message)
	return true, nil
}

func roomState(c *Context) (bool, error) {
	var msg roomJoinMsg
	_ = json.Unmarshal(c.Raw, &msg)
	code := strings.ToUpper(msg.Code)
	if code == "" {
		// if empty, try authed user's room; else lobby state
		if uid, err := authedUser(c); err == nil {
			if rc, _ := rooms.GetUserRoom(c.Ctx, uid); rc != "" {
				if r, users, err := rooms.GetRoom(c.Ctx, rc); err == nil {
					writeJSON(c.Conn, map[string]any{"type": "room:state", "room": r, "users": users})
					startSubscription(c.Ctx, c.Conn, r.Code)
					return true, nil
				}
			}
		}
		writeJSON(c.Conn, map[string]any{"type": "room:state", "room": map[string]any{"state": "lobby"}})
		return true, nil
	}
	if r, users, err := rooms.GetRoom(c.Ctx, code); err == nil {
		writeJSON(c.Conn, map[string]any{"type": "room:state", "room": r, "users": users})
		return true, nil
	}
	writeJSON(c.Conn, map[string]any{"type": "room:error", "error": "room not found"})
	return true, nil
}

func roomStart(c *Context) (bool, error) {
	var msg roomStartMsg
	_ = json.Unmarshal(c.Raw, &msg)
	userID, err := authedUser(c)
	if err != nil {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": "unauthorized"})
		return true, nil
	}
	code := strings.ToUpper(msg.Code)
	isMember, _ := rooms.IsMember(c.Ctx, code, userID)
	if !isMember {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": "not a member"})
		return true, nil
	}
	r, err := rooms.UpdateState(c.Ctx, code, "in-game", msg.GameState)
	if err != nil {
		writeJSON(c.Conn, map[string]any{"type": "room:error", "error": err.Error()})
		return true, nil
	}
	writeJSON(c.Conn, map[string]any{"type": "room:started", "room": r})
	return true, nil
}

func deliverRoomStateAfterAuth(baseCtx context.Context, conn *websocket.Conn, reg *connections.Registry, socketID, userID string) {
	if code, _ := rooms.GetUserRoom(baseCtx, userID); code != "" {
		if r, users, err := rooms.GetRoom(baseCtx, code); err == nil {
			writeJSON(conn, map[string]any{"type": "room:state", "room": r, "users": users})
			startSubscription(baseCtx, conn, r.Code)
			return
		}
	}
	writeJSON(conn, map[string]any{"type": "room:state", "room": map[string]any{"state": "lobby"}})
}
