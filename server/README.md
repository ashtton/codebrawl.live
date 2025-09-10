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

## Docker

Build the image:

```
docker build -t codebrawl-server:latest .
```

Run the container (exposes port 8080):

```
docker run --rm -p 8080:8080 \
  --env AWS_ACCOUNT_ID=your_id \
  --env AWS_ACCOUNT_SECRET=your_secret \
  --env S3_SUBMISSIONS=your_bucket \
  --env SQS_SUBMISSIONS=queue_url \
  --env SQS_RESULTS=results_queue_url \
  --env CLERK_ISSUER=https://your-app.clerk.accounts.dev \
  codebrawl-server:latest
```

Alternatively, you can mount a .env file (optional in code):

```
docker run --rm -p 8080:8080 --env-file .env codebrawl-server:latest
```
