package database

import (
	"database/sql"
	"fmt"
)

// Migrate 执行数据库建表。
func Migrate(db *sql.DB) error {
	ddl := []string{
		`CREATE TABLE IF NOT EXISTS accounts (
			id TEXT PRIMARY KEY,
			provider TEXT NOT NULL,
			name TEXT NOT NULL,
			access_key TEXT NOT NULL,
			encrypted_secret TEXT NOT NULL,
			endpoint TEXT,
			region TEXT,
			service_name TEXT,
			internal INTEGER NOT NULL DEFAULT 0,
			paging INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS settings (
			setting_key TEXT PRIMARY KEY,
			setting_value TEXT NOT NULL,
			updated_at DATETIME NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS transfers (
			id TEXT PRIMARY KEY,
			type TEXT NOT NULL,
			bucket TEXT NOT NULL,
			object_key TEXT NOT NULL,
			status TEXT NOT NULL,
			progress INTEGER NOT NULL DEFAULT 0,
			error_message TEXT,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		);`,
	}

	for _, sqlText := range ddl {
		if _, err := db.Exec(sqlText); err != nil {
			return fmt.Errorf("exec migration failed: %w", err)
		}
	}

	return seedDefaultSettings(db)
}

func seedDefaultSettings(db *sql.DB) error {
	defaults := map[string]string{
		"language":         `"system"`,
		"theme":            `"system"`,
		"https":            `true`,
		"hideDeleteButton": `false`,
		"paging":           `false`,
		"copyType":         `"url"`,
	}

	for key, value := range defaults {
		_, err := db.Exec(
			`INSERT OR IGNORE INTO settings(setting_key, setting_value, updated_at)
			VALUES (?, ?, datetime('now'));`,
			key,
			value,
		)
		if err != nil {
			return fmt.Errorf("seed settings failed: %w", err)
		}
	}

	return nil
}
