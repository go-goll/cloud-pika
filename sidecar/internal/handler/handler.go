package handler

import (
	"database/sql"
	"errors"

	"github.com/goll/cloud-pika/sidecar/internal/config"
	"github.com/goll/cloud-pika/sidecar/internal/crypto"
	"github.com/goll/cloud-pika/sidecar/internal/database"
	"github.com/goll/cloud-pika/sidecar/internal/model"
	"github.com/goll/cloud-pika/sidecar/internal/queue"
	"github.com/goll/cloud-pika/sidecar/internal/storage"
)

// Handler 聚合所有 HTTP 处理依赖。
type Handler struct {
	cfg       config.Config
	encryptor crypto.Service
	accounts  database.AccountStore
	settings  database.SettingsStore
	transfers database.TransferStore
	queue     *queue.Manager
	providers storage.Factory
}

func New(cfg config.Config, db *sql.DB, queueMgr *queue.Manager) *Handler {
	return &Handler{
		cfg:       cfg,
		encryptor: crypto.NewService(cfg.MasterKey),
		accounts:  database.NewAccountStore(db),
		settings:  database.NewSettingsStore(db),
		transfers: database.NewTransferStore(db),
		queue:     queueMgr,
		providers: storage.NewFactory(),
	}
}

func maskAccount(account model.Account) model.Account {
	account.SecretKey = ""
	return account
}

func (h *Handler) accountWithSecret(id string) (model.Account, error) {
	account, encrypted, err := h.accounts.FindByID(id)
	if err != nil {
		return model.Account{}, err
	}

	if encrypted != "" {
		secret, decryptErr := h.encryptor.Decrypt(encrypted)
		if decryptErr != nil {
			return model.Account{}, decryptErr
		}
		account.SecretKey = secret
	}

	return account, nil
}

func isNotFound(err error) bool {
	return errors.Is(err, sql.ErrNoRows)
}
