package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"server/config"
	"server/connections"
	"server/events"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var reg = connections.NewRegistry()

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()
	id := fmt.Sprintf("%p", conn)
	reg.Set(id, "", connections.StateConnecting)
	log.Println("Connected", id)
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			reg.UpdateState(id, connections.StateClosed)
			break
		}

		evType, handled, derr := events.Dispatch(context.Background(), conn, id, reg, message)
		if derr != nil {
			resp := map[string]any{"type": "error", "error": derr.Error()}
			b, _ := json.Marshal(resp)
			_ = conn.WriteMessage(websocket.TextMessage, b)
		}

		if !handled {
			fmt.Printf("Unhandled event %s %s", evType, message)
		}

		if evType != "" {
			reg.UpdateState(id, connections.State(evType))
		}
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	}
	reg.Delete(id)
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file to load.")
	}

	config.LoadEnvironment()

	http.HandleFunc("/ws", wsHandler)
	err = http.ListenAndServe(":"+config.Port, nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
