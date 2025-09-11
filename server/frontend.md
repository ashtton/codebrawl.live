Frontend integration notes for WebSocket events

Audience: client developers integrating the site/app with the server’s single WebSocket endpoint.

Endpoint
- URL: ws://<host>:<PORT>/ws
- Origin policy: currently permissive in development.

Message envelope
- All messages are JSON objects with a top-level string field "type".
- Client → Server: send commands/events with {"type": "...", ...}.
- Server → Client: responses and push updates use the same envelope.
- On handler error, the server emits {"type": "error", "error": string} or a typed error like room:error; treat these as non-fatal unless noted.

Auth flow
- Request: {"type": "auth", "userId": string (optional), "token": string}
  - token: a Clerk JWT. If userId is present, it must equal the JWT sub.
- Success response: {"type": "auth:ok", "userId": string, "username": string, "imageUrl": string, "issuer": string, "exp": number}
  - username and imageUrl are echoed from the JWT claims when present; may be empty strings if omitted by issuer.
  - After auth, the server updates the connection registry and pushes current room state.
- Failure response: {"type": "auth:error", "error": string}

Ping
- Request: {"type": "ping"}
- Response:
  - If authenticated: server may push current room state and return {"type":"room:state", ...}.
  - If unauthenticated: server returns {"type": "room:state", "room": {"state": "lobby"}}.

Rooms
- Create room
  - Request: {"type": "room:create", "roomType": string, "maxUsers": number (optional)}
  - Responses:
    - Success: {"type": "room:created", "room": Room}
    - Error: {"type": "room:error", "error": string}
- Join room
  - Request: {"type": "room:join", "code": string}
  - Responses:
    - Success: {"type": "room:joined", "room": Room, "users": {"userId": string, "username": string, "imageUrl": string}[]}
    - Error: {"type": "room:error", "error": string}
- Leave room
  - Request: {"type": "room:leave", "code": string}
  - Responses:
    - Success: {"type": "room:left", "code": string}
    - Error: {"type": "room:error", "error": string}
- Room chat
  - Request: {"type": "room:chat", "code": string, "message": string}
  - Responses:
    - Success broadcast: {"type": "room:chat", "code": string, "from": string, "message": string, "ts": number, "username": string, "imageUrl": string}
      - from is the sender userId; username and imageUrl are included when available.
    - Error: {"type": "room:error", "error": string}
- Room state
  - Request: {"type": "room:state", "code": string (optional)}
  - Responses:
    - Success: {"type": "room:state", "room": Room}
    - Error: {"type": "room:error", "error": string}
- Start game
  - Request: {"type": "room:start", "code": string, "gameState": any}
  - Responses:
    - Success: {"type": "room:started", "room": Room}
    - Error: {"type": "room:error", "error": string}

Push updates
- After joining a room, the client receives push updates for that room over the same socket. These are sent as event-specific messages (e.g., room:state, room:chat, room:started).

User identity hints
- On successful auth, the server also updates Redis caches:
  - Hash usernames: { [userId]: username }
  - Hash user_image_urls: { [userId]: imageUrl }
- Frontend can request/display usernames and avatars from subsequent server emissions that include userId, using these caches server-side for enrichment where applicable.

Error protocol
- Generic: {"type": "error", "error": string}
- Room-scoped: {"type": "room:error", "error": string}

Notes
- The server updates the connection state internally but only returns explicit messages as documented above.
- All timestamps are Unix seconds.
- Region, AWS interactions, and Redis are transparent to the client for normal WS operation.