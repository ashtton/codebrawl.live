# Server
Golang websocket server for responding to codebrawl requests

## Event handling
Incoming WebSocket messages are dispatched by type via the events package. Each event can live in its own file under server/events.

- Add a new event: create a file in events/, call events.Register("your_type", handler) in init(), and implement the handler func.
- Handler signature: func(c *events.Context) (handled bool, err error)
  - Return handled=true if you have fully handled the message (including any responses written to the socket).
  - Return err to have the dispatcher send a generic `{type:"error", error:"..."}` message.
- The dispatcher automatically updates the connection registry's state to the event type after handling.

Example: auth event is implemented in events/auth.go and responds with `auth:ok` or `auth:error`.

## Rooms & Redis
- Rooms and room state are stored in Redis. Provide REDIS_URL for this feature.
- Users can create/join/leave rooms after authenticating. Chat messages are relayed via Redis Pub/Sub.
- Configure max users via ROOM_MAX_USERS (default 8).
- See frontend.md for event contracts.

## Docker

Build the image:

```
docker build -t codebrawl-server:latest .
```

 you can mount a .env file:

```
docker run --rm -p 8080:8080 --env-file .env codebrawl-server:latest
```
