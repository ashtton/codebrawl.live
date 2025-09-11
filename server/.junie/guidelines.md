Project-specific development guidelines for codebrawl.live/server

Scope
- Audience: experienced Go developers working on this WebSocket server and its AWS/Redis integrations.
- Goal: capture non-obvious, repo-specific practices so onboarding doesn’t require code archeology.

Build and run
- Go toolchain: go 1.22.x (see go.mod). Local builds should use 1.22 or newer compatible minor versions.
- Dependencies: run `go mod tidy` once after checkout to ensure go.sum is complete. Some environments require this before the first build.
- Local run:
  - Copy .example.env to .env and adjust values. The server will load .env automatically via github.com/joho/godotenv.
  - Minimal required env for the HTTP server: PORT (e.g., 8080). Redis and AWS are optional for boot.
  - Start: `go run ./` then connect to ws://localhost:<PORT>/ws.
- Docker:
  - The Dockerfile currently references golang:1.25 for the builder stage while go.mod targets 1.22. If your registry does not provide 1.25 yet, use golang:1.22 or 1.23 in the builder stage.
  - Build: `docker build -t codebrawl-server:latest .`
  - Run: `docker run --rm -p 8080:8080 --env-file .env codebrawl-server:latest`

Configuration model
- Environment loader: config.LoadEnvironment reads required values at startup into package-level variables. If a value is missing, most components degrade gracefully or remain inactive (example: Redis only initializes when REDIS_URL is provided or set in the environment).
- Relevant environment variables (actual names used by the code):
  - PORT: HTTP listen port for the WebSocket server.
  - REDIS_URL: Optional. If present, database.InitRedis connects and pings. Supports either a full redis:// URL or host:port. On success you’ll see "Redis connected" in logs. Close is deferred in main.
  - CLERK_ISSUER: Required for auth event verification (e.g., https://<app>.clerk.accounts.dev). Optional CLERK_JWKS_URL overrides the JWKS endpoint; when unset, defaults to <issuer>/.well-known/jwks.json.
  - S3_SUBMISSIONS: Name of the S3 bucket used by dummy submission tooling.
  - SQS_SUBMISSIONS: URL of the SQS queue that receives submission metadata.
  - SQS_RESULTS: URL of the SQS queue that receives S3 event notifications for results.json objects.
  - AWS_ACCOUNT_ID and AWS_ACCOUNT_SECRET: Despite their names, these are consumed as static AWS access key id and secret by dummy.go. They are not the numeric AWS account id. Use IAM user keys with S3/SQS permissions in development.
- Region: AWS operations default to us-east-1 via config.AwsRegion.

Runtime architecture
- Entry point: main.go starts an HTTP server and exposes a single WebSocket endpoint at /ws. Origins are not restricted (CheckOrigin returns true); address this before production exposure.
- WebSocket handling:
  - Gorilla/WebSocket upgrader with read/write buffers of 1024.
  - Read loop: reads text messages, dispatches by type via events.Dispatch, writes any error responses, updates connection state in the registry, and refreshes a 60s read deadline.
  - Connection registry: connections.Registry tracks socket id, user id, current state, and last update time. State is updated to the handled event’s type string, and explicitly set to "authed" upon successful auth.
- Events subsystem:
  - events.Dispatch parses {"type": string, ...} and routes to a Handler of signature func(*events.Context) (handled bool, err error).
  - Register new events in init() using events.Register("your_type", handler). See events/auth.go as the reference.
  - If a handler returns err, the dispatcher sends a generic {type: "error", error: "..."} over the socket.
- Auth event (auth):
  - The client sends {type:"auth", userId:"...", token:"<JWT>"}.
  - Token is verified against Clerk’s JWKS (issuer from CLERK_ISSUER). If userId is supplied and differs from JWT sub, the request is rejected.
  - On success: registry is updated to StateAuthed for the socket and a response {type:"auth:ok", userId, issuer, exp} is sent.

AWS integrations (development tooling and background consumer)
- The production server does not start any SQS/S3 consumers. The only AWS interactions present are:
  1) dummy.go: sendDummySubmission() — a helper that uploads a code artifact to S3 (S3_SUBMISSIONS) and enqueues a submission message to SQS_SUBMISSIONS. It also starts a results S3 event consumer for SQS_RESULTS in-process. This function is not invoked by main and is intended for manual/local testing.
  2) results.go: startS3EventConsumer(sess, queueURL) — long-polls SQS for S3 event notifications, fetches the referenced results.json from S3 when present, and prints a summary. It always deletes the SQS message after handling.
- To experiment locally with AWS flows:
  - Provide AWS_ACCOUNT_ID and AWS_ACCOUNT_SECRET as static credentials (access key id and secret). Ensure these keys have permissions for S3 put/get and SQS send/receive/delete on the resources referenced by S3_SUBMISSIONS, SQS_SUBMISSIONS, and SQS_RESULTS.
  - Create a tiny main or test harness that calls sendDummySubmission() if you want to exercise the flow. Avoid wiring this into the default server main.

Operational notes and pitfalls
- Sensitive env: Do not commit real credentials. Use .example.env as the template. The .env in this repo is for local/dev only and should be replaced with your own secrets before running.
- Redis is optional: If REDIS_URL is unset or invalid, the server still starts; only Redis features will be unavailable. Initialization errors are logged.
- Deadlines: The WebSocket read deadline is extended to now+60s after each handled message. Idle connections for >60s will error on the next read.
- State transitions: After each handled event, the registry’s state is set to the event type string, except for closed/errored reads which set StateClosed.
- Cross-origin: CheckOrigin is permissive. If you deploy behind a browser client, restrict origins by replacing the upgrader’s CheckOrigin.
- Error protocol: Handlers returning an error produce a generic {type:"error", error:"..."} message. If a handler needs a typed error channel, emit your own error events and also return handled=true to prevent duplication.
- Region coupling: All AWS calls assume us-east-1. If you need multi-region, promote region to configuration.

Adding a new event
- Create events/<name>.go with an init() that registers the handler.
- Define a request struct matching the expected JSON. Unmarshal using the events.Context.Raw if you need the raw bytes.
- Perform work, write responses with websocket.TextMessage, and return (true, nil) if fully handled.
- If your handler updates connection user state, call c.Registry.Set(c.SocketID, userID, connections.StateAuthed) or UpdateState accordingly.

Testing the WebSocket endpoint quickly
- Without auth: connect to ws://localhost:<PORT>/ws and send {"type":"ping"}. If no handler exists, the server logs "Unhandled event ping ...". Add a ping handler if you want a canonical smoke test.
- With auth: set CLERK_ISSUER (and CLERK_JWKS_URL if needed). Send {"type":"auth","userId":"<subject>","token":"<clerk_jwt>"}. Expect auth:ok on success.

Local Redis suggestions
- Use Docker: `docker run --rm -p 6379:6379 redis:7-alpine`
- Env: REDIS_URL=redis://default:password@localhost:6379/ if you need auth; otherwise REDIS_URL=localhost:6379 works (the code handles plain host:port too).

Logging & observability
- Logs are simple stdlib log.Printf calls. For more context add request IDs to events.Context and enhance logs in handlers.
- When diagnosing auth failures, enable HTTP tracing to verify JWKS fetch and confirm the JWK kid matches the JWT header kid.

Security considerations before production
- Lock down CheckOrigin.
- Replace static AWS credentials with an instance role or workload identity.
- Validate and sanitize any event payloads; current dispatcher only checks for a non-empty type.
- Rate limiting/backpressure may be necessary for high fan-in WS traffic.

Known rough edges
- Docker builder image tag (1.25) likely exceeds available tags in some registries while go.mod is 1.22 — sync these.
- Env names AWS_ACCOUNT_ID/AWS_ACCOUNT_SECRET are misnamed for their usage; they are actually AWS access key id/secret for development helpers. Consider renaming to AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY in the future and mapping both for compatibility.
- The results SQS consumer isn’t started by main; it’s only used by the dummy tooling. If you need server-side background processing, introduce a separate process or wire it behind a build tag/env flag.

Housekeeping
- Keep guidelines project-specific and avoid duplicating generic Go knowledge here.
- Do not add code comments. Use proper golang semantics.