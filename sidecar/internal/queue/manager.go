package queue

import (
	"context"
	"database/sql"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/goll/cloud-pika/sidecar/internal/database"
	"github.com/goll/cloud-pika/sidecar/internal/model"
)

type publisher interface {
	Publish(event string, payload any)
}

// Job 描述队列任务的实际执行逻辑。
type Job func(ctx context.Context, notifyProgress func(progress int)) error

// EnqueuePayload 为入队参数。
type EnqueuePayload struct {
	Type   string
	Bucket string
	Key    string
	Run    Job
}

// Manager 维护任务队列与状态变更。
type Manager struct {
	store database.TransferStore
	hub   publisher

	mu      sync.RWMutex
	cancels map[string]context.CancelFunc
}

func NewManager(db *sql.DB, hub publisher) *Manager {
	return &Manager{
		store:   database.NewTransferStore(db),
		hub:     hub,
		cancels: make(map[string]context.CancelFunc),
	}
}

func (m *Manager) List() ([]model.TransferTask, error) {
	return m.store.List()
}

func (m *Manager) Publish(event string, payload any) {
	m.hub.Publish(event, payload)
}

func (m *Manager) Enqueue(payload EnqueuePayload) (string, error) {
	now := time.Now().UTC()
	task := model.TransferTask{
		ID:        uuid.NewString(),
		Type:      payload.Type,
		Bucket:    payload.Bucket,
		Key:       payload.Key,
		Status:    "queued",
		Progress:  0,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := m.store.Upsert(task); err != nil {
		return "", err
	}
	m.hub.Publish("transfer.queued", ginPayload(task))

	ctx, cancel := context.WithCancel(context.Background())
	m.mu.Lock()
	m.cancels[task.ID] = cancel
	m.mu.Unlock()

	go m.run(ctx, task, payload.Run)
	return task.ID, nil
}

func (m *Manager) run(ctx context.Context, task model.TransferTask, job Job) {
	task.Status = "running"
	task.Progress = 1
	task.UpdatedAt = time.Now().UTC()
	_ = m.store.Upsert(task)
	m.hub.Publish("transfer.progress", ginPayload(task))

	notify := func(progress int) {
		if progress <= task.Progress {
			return
		}
		if progress >= 100 {
			progress = 99
		}
		task.Progress = progress
		task.UpdatedAt = time.Now().UTC()
		_ = m.store.Upsert(task)
		m.hub.Publish("transfer.progress", ginPayload(task))
	}

	var runErr error
	if job != nil {
		runErr = job(ctx, notify)
	}

	switch {
	case ctx.Err() == context.Canceled:
		task.Status = "canceled"
		task.ErrorMessage = "canceled"
		task.UpdatedAt = time.Now().UTC()
		_ = m.store.Upsert(task)
		m.hub.Publish("transfer.failed", ginPayload(task))
	case runErr != nil:
		task.Status = "failed"
		task.ErrorMessage = runErr.Error()
		task.UpdatedAt = time.Now().UTC()
		_ = m.store.Upsert(task)
		m.hub.Publish("transfer.failed", ginPayload(task))
	default:
		task.Status = "completed"
		task.Progress = 100
		task.UpdatedAt = time.Now().UTC()
		_ = m.store.Upsert(task)
		m.hub.Publish("transfer.completed", ginPayload(task))
	}

	m.cleanup(task.ID)
}

func (m *Manager) Cancel(id string) {
	m.mu.RLock()
	cancel, ok := m.cancels[id]
	m.mu.RUnlock()
	if !ok {
		return
	}
	cancel()
}

func (m *Manager) cleanup(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.cancels, id)
}

func ginPayload(task model.TransferTask) map[string]any {
	return map[string]any{"transfer": task}
}
