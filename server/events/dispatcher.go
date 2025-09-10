package events

import (
	"context"
	"encoding/json"
	"errors"
	"server/connections"

	"github.com/gorilla/websocket"
)

type Context struct {
	Ctx      context.Context
	Conn     *websocket.Conn
	SocketID string
	Registry *connections.Registry
	Raw      []byte
}

type Handler func(c *Context) (handled bool, err error)

var handlers = map[string]Handler{}

func Register(eventType string, h Handler) {
	handlers[eventType] = h
}

func Dispatch(baseCtx context.Context, conn *websocket.Conn, socketID string, reg *connections.Registry, payload []byte) (eventType string, handled bool, err error) {
	var generic struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(payload, &generic); err != nil {
		return "", false, err
	}
	if generic.Type == "" {
		return "", false, errors.New("missing type")
	}
	ctx := &Context{Ctx: baseCtx, Conn: conn, SocketID: socketID, Registry: reg, Raw: payload}
	if h, ok := handlers[generic.Type]; ok {
		handled, err = h(ctx)
		return generic.Type, handled, err
	}
	return generic.Type, false, nil
}
