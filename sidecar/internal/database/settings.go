package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// SettingsStore 负责应用设置持久化。
type SettingsStore struct {
	db *sql.DB
}

func NewSettingsStore(db *sql.DB) SettingsStore {
	return SettingsStore{db: db}
}

func (s SettingsStore) Get() (model.AppSettings, error) {
	rows, err := s.db.Query(`SELECT setting_key, setting_value FROM settings;`)
	if err != nil {
		return model.AppSettings{}, fmt.Errorf("query settings failed: %w", err)
	}
	defer rows.Close()

	settings := model.AppSettings{
		Language:         "system",
		Theme:            "system",
		HTTPS:            true,
		HideDeleteButton: false,
		Paging:           false,
		CopyType:         "url",
	}

	for rows.Next() {
		var (
			key   string
			value string
		)
		if err = rows.Scan(&key, &value); err != nil {
			return model.AppSettings{}, fmt.Errorf("scan settings failed: %w", err)
		}
		switch key {
		case "language":
			_ = json.Unmarshal([]byte(value), &settings.Language)
		case "theme":
			_ = json.Unmarshal([]byte(value), &settings.Theme)
		case "https":
			_ = json.Unmarshal([]byte(value), &settings.HTTPS)
		case "hideDeleteButton":
			_ = json.Unmarshal([]byte(value), &settings.HideDeleteButton)
		case "paging":
			_ = json.Unmarshal([]byte(value), &settings.Paging)
		case "copyType":
			_ = json.Unmarshal([]byte(value), &settings.CopyType)
		}
	}
	if err = rows.Err(); err != nil {
		return model.AppSettings{}, fmt.Errorf("iterate settings failed: %w", err)
	}

	return settings, nil
}

func (s SettingsStore) Save(input model.AppSettings) error {
	payload := map[string]any{
		"language":         input.Language,
		"theme":            input.Theme,
		"https":            input.HTTPS,
		"hideDeleteButton": input.HideDeleteButton,
		"paging":           input.Paging,
		"copyType":         input.CopyType,
	}

	for key, value := range payload {
		raw, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("marshal setting %s failed: %w", key, err)
		}
		_, err = s.db.Exec(
			`INSERT INTO settings(setting_key, setting_value, updated_at)
			VALUES (?, ?, ?)
			ON CONFLICT(setting_key)
			DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at;`,
			key,
			string(raw),
			time.Now().UTC(),
		)
		if err != nil {
			return fmt.Errorf("save setting %s failed: %w", key, err)
		}
	}

	return nil
}
