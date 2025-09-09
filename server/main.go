package main

import (
	"fmt"
	"log"
	"net/http"
	"server/config"

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

func wsHandler(w http.ResponseWriter, r *http.Request) {

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()
	log.Println("Connected")
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break // Exit the loop on error (e.g., client disconnected).
		}

		fmt.Printf("Received message: %s\n", message)

		// Echo the received message back to the client.
		if err := conn.WriteMessage(messageType, message); err != nil {
			log.Println("Error writing message:", err)
			break
		}
	}
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file to load.")
	}

	config.LoadEnvironment()
	sendDummySubmission()

	http.HandleFunc("/ws", wsHandler)
	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
