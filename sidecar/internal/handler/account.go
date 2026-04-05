package handler

import (
	"net/http"
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

	if payload.Provider == "" || payload.Name == "" || payload.AccessKey == "" || payload.SecretKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provider/name/accessKey/secretKey required"})
		return
	}

	now := time.Now().UTC()
	account := model.Account{
		ID:          uuid.NewString(),
		Provider:    payload.Provider,
		Name:        payload.Name,
		AccessKey:   payload.AccessKey,
		Endpoint:    payload.Endpoint,
		Region:      payload.Region,
		ServiceName: payload.ServiceName,
		Internal:    payload.Internal,
		Paging:      payload.Paging,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	encrypted, err := h.encryptor.Encrypt(payload.SecretKey)
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

	updated := oldAccount
	updated.Provider = payload.Provider
	updated.Name = payload.Name
	updated.AccessKey = payload.AccessKey
	updated.Endpoint = payload.Endpoint
	updated.Region = payload.Region
	updated.ServiceName = payload.ServiceName
	updated.Internal = payload.Internal
	updated.Paging = payload.Paging
	updated.UpdatedAt = time.Now().UTC()

	secret := payload.SecretKey
	if secret == "" {
		secret, err = h.encryptor.Decrypt(encryptedSecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	encrypted, err := h.encryptor.Encrypt(secret)
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
