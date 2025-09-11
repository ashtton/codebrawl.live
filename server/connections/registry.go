package connections

import (
	"context"
	"encoding/json"
	"time"

	"server/database"
)

type State string

const (
	StateUnknown   State = "unknown"
	StateConnecting      = "connecting"
	StateAuthed          = "authed"
	StateClosed          = "closed"
)

type Entry struct {
	SocketID string
	UserID   string
	State    State
	Updated  time.Time
}

type Registry struct{}

func NewRegistry() *Registry { return &Registry{} }

func key(socketID string) string { return "conn:" + socketID }

func (r *Registry) Set(socketID, userID string, state State) {
	r.Update(socketID, userID, state)
}

func (r *Registry) Update(socketID, userID string, state State) {
	rdb := database.Client()
	if rdb == nil {
		return
	}
	ctx := context.Background()
	e := Entry{SocketID: socketID, UserID: userID, State: state, Updated: time.Now()}
	b, _ := json.Marshal(e)
	// TTL slightly above WS deadline (60s)
	_ = rdb.Set(ctx, key(socketID), b, 70*time.Second).Err()
}

func (r *Registry) UpdateState(socketID string, state State) {
	rdb := database.Client()
	if rdb == nil {
		return
	}
	ctx := context.Background()
	// Try to get current to preserve userID
	if val, err := rdb.Get(ctx, key(socketID)).Bytes(); err == nil {
		var e Entry
		if json.Unmarshal(val, &e) == nil {
			e.State = state
			e.Updated = time.Now()
			b, _ := json.Marshal(e)
			_ = rdb.Set(ctx, key(socketID), b, 70*time.Second).Err()
			return
		}
	}
	// If not found, create with empty user
	r.Update(socketID, "", state)
}

func (r *Registry) Get(socketID string) (Entry, bool) {
	rdb := database.Client()
	if rdb == nil {
		return Entry{}, false
	}
	ctx := context.Background()
	if val, err := rdb.Get(ctx, key(socketID)).Bytes(); err == nil {
		var e Entry
		if json.Unmarshal(val, &e) == nil {
			return e, true
		}
	}
	return Entry{}, false
}

func (r *Registry) Delete(socketID string) {
	rdb := database.Client()
	if rdb == nil {
		return
	}
	ctx := context.Background()
	_ = rdb.Del(ctx, key(socketID)).Err()
}

func (r *Registry) Count() int {
	rdb := database.Client()
	if rdb == nil {
		return 0
	}
	ctx := context.Background()
	// Use scan to count keys; avoid heavy KEYS in prod, approximate
	var (
		cursor uint64
		count  int
	)
	for {
		keys, cur, err := rdb.Scan(ctx, cursor, "conn:*", 100).Result()
		if err != nil {
			break
		}
		count += len(keys)
		cursor = cur
		if cursor == 0 {
			break
		}
	}
	return count
}
