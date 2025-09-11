package events

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

var wsWriteGuards sync.Map // key: *websocket.Conn, value: *sync.Mutex

func RegisterConn(conn *websocket.Conn) {
	if conn == nil {
		return
	}
	_, _ = wsWriteGuards.LoadOrStore(conn, &sync.Mutex{})
}

func UnregisterConn(conn *websocket.Conn) {
	if conn == nil {
		return
	}
	wsWriteGuards.Delete(conn)
}

func lockFor(conn *websocket.Conn) *sync.Mutex {
	if conn == nil {
		return &sync.Mutex{}
	}
	if v, ok := wsWriteGuards.Load(conn); ok {
		return v.(*sync.Mutex)
	}
	m := &sync.Mutex{}
	actual, _ := wsWriteGuards.LoadOrStore(conn, m)
	return actual.(*sync.Mutex)
}

func SafeWriteMessage(conn *websocket.Conn, data []byte) error {
	m := lockFor(conn)
	m.Lock()
	defer m.Unlock()
	return conn.WriteMessage(websocket.TextMessage, data)
}

func SafeWriteJSON(conn *websocket.Conn, v any) error {
	b, _ := json.Marshal(v)
	return SafeWriteMessage(conn, b)
}
