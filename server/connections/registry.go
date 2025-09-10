package connections

import (
	"sync"
	"time"
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

type Registry struct {
	mu      sync.RWMutex
	bySock  map[string]*Entry
}

func NewRegistry() *Registry {
	return &Registry{bySock: make(map[string]*Entry)}
}

func (r *Registry) Set(socketID, userID string, state State) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.bySock[socketID] = &Entry{SocketID: socketID, UserID: userID, State: state, Updated: time.Now()}
}

func (r *Registry) UpdateState(socketID string, state State) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if e, ok := r.bySock[socketID]; ok {
		e.State = state
		e.Updated = time.Now()
	}
}

func (r *Registry) Get(socketID string) (Entry, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if e, ok := r.bySock[socketID]; ok {
		return *e, true
	}
	return Entry{}, false
}

func (r *Registry) Delete(socketID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.bySock, socketID)
}

func (r *Registry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.bySock)
}
