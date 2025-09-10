package events

import (
	"encoding/json"
	"server/auth"
	"server/connections"

	"github.com/gorilla/websocket"
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
		_ = c.Conn.WriteMessage(websocket.TextMessage, b)
		return true, nil
	}
	c.Registry.Set(c.SocketID, res.UserID, connections.StateAuthed)
	resp := map[string]any{"type": "auth:ok", "userId": res.UserID, "issuer": res.Issuer, "exp": res.ExpiresAt.Unix()}
	b, _ := json.Marshal(resp)
	_ = c.Conn.WriteMessage(websocket.TextMessage, b)
	return true, nil
}
