package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// AccountStore 提供账户持久化访问能力。
type AccountStore struct {
	db *sql.DB
}

func NewAccountStore(db *sql.DB) AccountStore {
	return AccountStore{db: db}
}

func (s AccountStore) Create(account model.Account, encryptedSecret string) error {
	_, err := s.db.Exec(
		`INSERT INTO accounts (
			id, provider, name, access_key, encrypted_secret, endpoint, region,
			service_name, internal, paging, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
		account.ID,
		account.Provider,
		account.Name,
		account.AccessKey,
		encryptedSecret,
		account.Endpoint,
		account.Region,
		account.ServiceName,
		boolToInt(account.Internal),
		boolToInt(account.Paging),
		account.CreatedAt,
		account.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert account failed: %w", err)
	}

	return nil
}

func (s AccountStore) Update(account model.Account, encryptedSecret string) error {
	_, err := s.db.Exec(
		`UPDATE accounts SET
			provider = ?,
			name = ?,
			access_key = ?,
			encrypted_secret = ?,
			endpoint = ?,
			region = ?,
			service_name = ?,
			internal = ?,
			paging = ?,
			updated_at = ?
		WHERE id = ?;`,
		account.Provider,
		account.Name,
		account.AccessKey,
		encryptedSecret,
		account.Endpoint,
		account.Region,
		account.ServiceName,
		boolToInt(account.Internal),
		boolToInt(account.Paging),
		account.UpdatedAt,
		account.ID,
	)
	if err != nil {
		return fmt.Errorf("update account failed: %w", err)
	}

	return nil
}

func (s AccountStore) Delete(id string) error {
	_, err := s.db.Exec(`DELETE FROM accounts WHERE id = ?;`, id)
	if err != nil {
		return fmt.Errorf("delete account failed: %w", err)
	}
	return nil
}

func (s AccountStore) List() ([]model.Account, map[string]string, error) {
	rows, err := s.db.Query(
		`SELECT id, provider, name, access_key, encrypted_secret, endpoint, region,
			service_name, internal, paging, created_at, updated_at
		FROM accounts ORDER BY updated_at DESC;`,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("query accounts failed: %w", err)
	}
	defer rows.Close()

	accounts := make([]model.Account, 0)
	secrets := make(map[string]string)

	for rows.Next() {
		var (
			account         model.Account
			encryptedSecret string
			internal        int
			paging          int
		)
		if err = rows.Scan(
			&account.ID,
			&account.Provider,
			&account.Name,
			&account.AccessKey,
			&encryptedSecret,
			&account.Endpoint,
			&account.Region,
			&account.ServiceName,
			&internal,
			&paging,
			&account.CreatedAt,
			&account.UpdatedAt,
		); err != nil {
			return nil, nil, fmt.Errorf("scan account failed: %w", err)
		}
		account.Internal = internal == 1
		account.Paging = paging == 1
		accounts = append(accounts, account)
		secrets[account.ID] = encryptedSecret
	}

	if err = rows.Err(); err != nil {
		return nil, nil, fmt.Errorf("iterate account rows failed: %w", err)
	}

	return accounts, secrets, nil
}

func (s AccountStore) FindByID(id string) (model.Account, string, error) {
	var (
		account         model.Account
		encryptedSecret string
		internal        int
		paging          int
	)

	err := s.db.QueryRow(
		`SELECT id, provider, name, access_key, encrypted_secret, endpoint, region,
			service_name, internal, paging, created_at, updated_at
		FROM accounts WHERE id = ?;`,
		id,
	).Scan(
		&account.ID,
		&account.Provider,
		&account.Name,
		&account.AccessKey,
		&encryptedSecret,
		&account.Endpoint,
		&account.Region,
		&account.ServiceName,
		&internal,
		&paging,
		&account.CreatedAt,
		&account.UpdatedAt,
	)
	if err != nil {
		return model.Account{}, "", err
	}

	account.Internal = internal == 1
	account.Paging = paging == 1
	return account, encryptedSecret, nil
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func nowUTC() time.Time {
	return time.Now().UTC()
}
