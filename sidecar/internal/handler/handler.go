package handler

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

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
	providers storage.ProviderFactory
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

func (h *Handler) validateAccountConnectivity(account model.Account) error {
	provider, err := h.providers.Create(account.Provider)
	if err != nil {
		return newValidationErr(account.Provider, "provider", "unsupported provider", err)
	}
	if err = provider.Init(account); err != nil {
		return newValidationErr(account.Provider, "init", "provider init failed", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	_, err = provider.ListBuckets(ctx)
	if err != nil {
		return newValidationErr(account.Provider, "listBuckets", "credential validation failed", fmt.Errorf("validate account failed: %w", err))
	}
	return nil
}

func writeValidationError(c *gin.Context, err error) {
	var vErr *validationErr
	if errors.As(err, &vErr) {
		response := gin.H{
			"error":    vErr.Error(),
			"provider": vErr.Provider,
			"stage":    vErr.Stage,
		}
		if detail := vErr.Detail(); detail != "" {
			response["detail"] = detail
		}
		c.JSON(http.StatusBadRequest, response)
		return
	}
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}
