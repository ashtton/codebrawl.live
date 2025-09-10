# Server
Golang websocket server for responding to codebrawl requests

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
  codebrawl-server:latest
```

Alternatively, you can mount a .env file (optional in code):

```
docker run --rm -p 8080:8080 --env-file .env codebrawl-server:latest
```
