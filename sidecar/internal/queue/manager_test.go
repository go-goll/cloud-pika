package queue

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/goll/cloud-pika/sidecar/internal/database"
)

type testHub struct {
	mu     sync.Mutex
	events []string
}

func (h *testHub) Publish(event string, _ any) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.events = append(h.events, event)
}

func TestManagerCompletesTask(t *testing.T) {
	db, err := database.Open(t.TempDir() + "/queue-complete.sqlite")
	if err != nil {
		t.Fatalf("open db failed: %v", err)
	}
	defer db.Close()

	if err = database.Migrate(db); err != nil {
		t.Fatalf("migrate failed: %v", err)
	}

	hub := &testHub{}
	mgr := NewManager(db, hub)
	id, err := mgr.Enqueue(EnqueuePayload{
		Type:   "upload",
		Bucket: "b",
		Key:    "k",
		Run: func(_ context.Context, notify func(int)) error {
			notify(35)
			time.Sleep(50 * time.Millisecond)
			notify(85)
			return nil
		},
	})
	if err != nil {
		t.Fatalf("enqueue failed: %v", err)
	}

	status := waitStatus(t, mgr, id, 2*time.Second)
	if status != "completed" {
		t.Fatalf("expected completed, got %s", status)
	}
}

func TestManagerCancelsTask(t *testing.T) {
	db, err := database.Open(t.TempDir() + "/queue-cancel.sqlite")
	if err != nil {
		t.Fatalf("open db failed: %v", err)
	}
	defer db.Close()

	if err = database.Migrate(db); err != nil {
		t.Fatalf("migrate failed: %v", err)
	}

	hub := &testHub{}
	mgr := NewManager(db, hub)
	id, err := mgr.Enqueue(EnqueuePayload{
		Type:   "upload",
		Bucket: "b",
		Key:    "k",
		Run: func(ctx context.Context, _ func(int)) error {
			<-ctx.Done()
			return ctx.Err()
		},
	})
	if err != nil {
		t.Fatalf("enqueue failed: %v", err)
	}

	time.Sleep(40 * time.Millisecond)
	mgr.Cancel(id)

	status := waitStatus(t, mgr, id, 2*time.Second)
	if status != "canceled" {
		t.Fatalf("expected canceled, got %s", status)
	}
}

func waitStatus(t *testing.T, mgr *Manager, id string, timeout time.Duration) string {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		list, err := mgr.List()
		if err != nil {
			t.Fatalf("list failed: %v", err)
		}
		for _, item := range list {
			if item.ID == id {
				if item.Status == "completed" || item.Status == "failed" || item.Status == "canceled" {
					return item.Status
				}
			}
		}
		time.Sleep(40 * time.Millisecond)
	}
	t.Fatalf("wait status timeout for task %s", id)
	return ""
}
