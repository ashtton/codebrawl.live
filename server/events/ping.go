package events

import (
	"server/connections"
)

func init() { Register("ping", pingHandler) }

func pingHandler(c *Context) (bool, error) {
	// Try to get authed user; if present, deliver actual room state and subscribe.
	if uid, err := authedUser(c); err == nil && uid != "" {
		deliverRoomStateAfterAuth(c.Ctx, c.Conn, c.Registry, c.SocketID, uid)
		c.Registry.UpdateState(c.SocketID, connections.State("ping"))
		return true, nil
	}
	// If unauthenticated, send lobby state.
	writeJSON(c.Conn, map[string]any{"type": "room:state", "room": map[string]any{"state": "lobby"}})
	c.Registry.UpdateState(c.SocketID, connections.State("ping"))
	return true, nil
}
