package events

import (
	"encoding/json"
	"log"
	"server/auth"
	"server/connections"
	"server/database"
)

func init() { Register("auth", authHandler) }

type authMessage struct {
	Type   string `json:"type"`
	UserID string `json:"userId"`
	Token  string `json:"token"`
}

func authHandler(c *Context) (bool, error) {
	res, err := auth.ParseAndVerifyAuthMessage(c.Ctx, c.Raw)
	if err != nil {
		resp := map[string]any{"type": "auth:error", "error": err.Error()}
		b, _ := json.Marshal(resp)
		_ = SafeWriteMessage(c.Conn, b)
		return true, nil
	}

	// Update connection registry to authed
	c.Registry.Set(c.SocketID, res.UserID, connections.StateAuthed)

	// Best-effort cache of user metadata in Redis
	if r := database.Client(); r != nil {
		if res.Username != "" {
			if err := r.HSet(c.Ctx, "usernames", res.UserID, res.Username).Err(); err != nil {
				log.Println("redis HSET usernames failed:", err)
			}
		}
		if res.ImageURL != "" {
			if err := r.HSet(c.Ctx, "user_image_urls", res.UserID, res.ImageURL).Err(); err != nil {
				log.Println("redis HSET user_image_urls failed:", err)
			}
		}
	}

	resp := map[string]any{"type": "auth:ok", "userId": res.UserID, "username": res.Username, "imageUrl": res.ImageURL, "issuer": res.Issuer, "exp": res.ExpiresAt.Unix()}
	b, _ := json.Marshal(resp)
	_ = SafeWriteMessage(c.Conn, b)
	// After auth, push current room state and subscribe to changes
	deliverRoomStateAfterAuth(c.Ctx, c.Conn, c.Registry, c.SocketID, res.UserID)
	return true, nil
}
