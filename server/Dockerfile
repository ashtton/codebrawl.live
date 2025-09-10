# syntax=docker/dockerfile:1
FROM golang:1.25 AS builder
WORKDIR /app

ENV CGO_ENABLED=0

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o server ./

FROM gcr.io/distroless/static:nonroot
WORKDIR /app

EXPOSE 8080

COPY --from=builder /app/server /app/server

USER nonroot:nonroot
ENTRYPOINT ["/app/server"]
