package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func (h *Handler) ListAccounts(c *gin.Context) {
	accounts, _, err := h.accounts.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := make([]model.Account, 0, len(accounts))
	for _, account := range accounts {
		result = append(result, maskAccount(account))
	}

	c.JSON(http.StatusOK, gin.H{"accounts": result})
}

func (h *Handler) CreateAccount(c *gin.Context) {
	var payload model.ProviderConfig
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	normalized, err := normalizeProviderConfig(payload)
	if err != nil {
		writeValidationError(c, err)
		return
	}

	now := time.Now().UTC()
	account := model.Account{
		ID:          uuid.NewString(),
		Provider:    normalized.Provider,
		Name:        normalized.Name,
		AccessKey:   normalized.AccessKey,
		Endpoint:    normalized.Endpoint,
		Region:      normalized.Region,
		ServiceName: normalized.ServiceName,
		Internal:    normalized.Internal,
		Paging:      normalized.Paging,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	account.SecretKey = normalized.SecretKey

	if err = h.validateAccountConnectivity(account); err != nil {
		writeValidationError(c, err)
		return
	}

	encrypted, err := h.encryptor.Encrypt(normalized.SecretKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err = h.accounts.Create(account, encrypted); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"account": maskAccount(account)})
}

func (h *Handler) UpdateAccount(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "account id required"})
		return
	}

	var payload model.ProviderConfig
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	oldAccount, encryptedSecret, err := h.accounts.FindByID(id)
	if err != nil {
		if isNotFound(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	secret := strings.TrimSpace(payload.SecretKey)
	if secret == "" {
		secret, err = h.encryptor.Decrypt(encryptedSecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	payload.SecretKey = secret
	normalized, err := normalizeProviderConfig(payload)
	if err != nil {
		writeValidationError(c, err)
		return
	}

	updated := oldAccount
	updated.Provider = normalized.Provider
	updated.Name = normalized.Name
	updated.AccessKey = normalized.AccessKey
	updated.Endpoint = normalized.Endpoint
	updated.Region = normalized.Region
	updated.ServiceName = normalized.ServiceName
	updated.Internal = normalized.Internal
	updated.Paging = normalized.Paging
	updated.UpdatedAt = time.Now().UTC()
	updated.SecretKey = normalized.SecretKey

	if err = h.validateAccountConnectivity(updated); err != nil {
		writeValidationError(c, err)
		return
	}

	encrypted, err := h.encryptor.Encrypt(normalized.SecretKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err = h.accounts.Update(updated, encrypted); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"account": maskAccount(updated)})
}

func (h *Handler) DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "account id required"})
		return
	}

	if err := h.accounts.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
