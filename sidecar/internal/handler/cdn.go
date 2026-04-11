package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/goll/cloud-pika/sidecar/internal/model"
	"github.com/goll/cloud-pika/sidecar/internal/storage"
)

type cdnPayload struct {
	AccountID string   `json:"accountId"`
	URLs      []string `json:"urls"`
}

// PrefetchCDN 提交 CDN 预热请求。
func (h *Handler) PrefetchCDN(c *gin.Context) {
	var payload cdnPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	cdn, ok := provider.(storage.CDNProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "CDN not supported"})
		return
	}

	if err = cdn.PrefetchCDN(c.Request.Context(), payload.URLs); err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetCDNQuota 查询 CDN 刷新/预热每日配额。
func (h *Handler) GetCDNQuota(c *gin.Context) {
	accountID := c.Query("accountId")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId required"})
		return
	}

	provider, err := h.providerFromAccount(accountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	cdn, ok := provider.(storage.CDNProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "CDN not supported"})
		return
	}

	quota, err := cdn.GetRefreshQuota(c.Request.Context())
	if err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"quota": quota})
}
