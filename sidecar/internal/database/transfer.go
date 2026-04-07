package database

import (
	"database/sql"
	"fmt"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// TransferStore 负责任务记录持久化。
type TransferStore struct {
	db *sql.DB
}

func NewTransferStore(db *sql.DB) TransferStore {
	return TransferStore{db: db}
}

func (s TransferStore) Upsert(task model.TransferTask) error {
	_, err := s.db.Exec(
		`INSERT INTO transfers (
			id, type, bucket, object_key, status, progress,
			error_message, speed, total_size, transferred_size,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id)
		DO UPDATE SET
			status = excluded.status,
			progress = excluded.progress,
			error_message = excluded.error_message,
			speed = excluded.speed,
			total_size = excluded.total_size,
			transferred_size = excluded.transferred_size,
			updated_at = excluded.updated_at;`,
		task.ID,
		task.Type,
		task.Bucket,
		task.Key,
		task.Status,
		task.Progress,
		task.ErrorMessage,
		task.Speed,
		task.TotalSize,
		task.TransferredSize,
		task.CreatedAt,
		task.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("upsert transfer failed: %w", err)
	}
	return nil
}

func (s TransferStore) List() ([]model.TransferTask, error) {
	rows, err := s.db.Query(
		`SELECT id, type, bucket, object_key, status, progress,
			error_message, speed, total_size, transferred_size,
			created_at, updated_at
		FROM transfers ORDER BY created_at DESC LIMIT 200;`,
	)
	if err != nil {
		return nil, fmt.Errorf("query transfers failed: %w", err)
	}
	defer rows.Close()

	result := make([]model.TransferTask, 0)
	for rows.Next() {
		var item model.TransferTask
		if err = rows.Scan(
			&item.ID,
			&item.Type,
			&item.Bucket,
			&item.Key,
			&item.Status,
			&item.Progress,
			&item.ErrorMessage,
			&item.Speed,
			&item.TotalSize,
			&item.TransferredSize,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan transfer failed: %w", err)
		}
		result = append(result, item)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate transfers failed: %w", err)
	}

	return result, nil
}
