package database

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

// Open 创建 SQLite 连接。
func Open(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open sqlite failed: %w", err)
	}

	if _, err = db.Exec(`PRAGMA journal_mode = WAL;`); err != nil {
		return nil, fmt.Errorf("enable wal failed: %w", err)
	}

	if _, err = db.Exec(`PRAGMA foreign_keys = ON;`); err != nil {
		return nil, fmt.Errorf("enable fk failed: %w", err)
	}

	if _, err = db.Exec(`PRAGMA busy_timeout = 5000;`); err != nil {
		return nil, fmt.Errorf("set busy timeout failed: %w", err)
	}

	return db, nil
}
