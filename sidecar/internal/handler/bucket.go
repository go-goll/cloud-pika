package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/goll/cloud-pika/sidecar/internal/model"
	"github.com/goll/cloud-pika/sidecar/internal/storage"
)

func (h *Handler) ListBuckets(c *gin.Context) {
	provider := c.Param("provider")
	accountID := c.Query("accountId")
	if provider == "" || accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provider/accountId required"})
		return
	}

	account, err := h.accountWithSecret(accountID)
	if err != nil {
		if isNotFound(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if account.Provider != provider {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "provider mismatch with account",
			"provider": account.Provider,
			"stage":    "payload",
		})
		return
	}

	p, err := h.providers.Create(provider)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err = p.Init(account); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "provider init failed",
			"provider": provider,
			"stage":    "init",
			"detail":   err.Error(),
		})
		return
	}

	h.queue.Publish("bucket.syncing", gin.H{
		"provider":  provider,
		"accountId": accountID,
		"status":    "start",
	})
	buckets, err := p.ListBuckets(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "list buckets failed",
			"provider": provider,
			"stage":    "listBuckets",
			"detail":   err.Error(),
		})
		return
	}
	h.queue.Publish("bucket.syncing", gin.H{
		"provider":  provider,
		"accountId": accountID,
		"status":    "done",
		"count":     len(buckets),
	})

	c.JSON(http.StatusOK, gin.H{"buckets": buckets})
}

func (h *Handler) ListObjects(c *gin.Context) {
	bucket := c.Param("bucket")
	if bucket == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bucket required"})
		return
	}

	var params model.ListParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	params.Bucket = bucket
	if params.Limit <= 0 {
		params.Limit = 200
	}

	account, err := h.accountWithSecret(params.AccountID)
	if err != nil {
		if isNotFound(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	p, err := h.providers.Create(account.Provider)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err = p.Init(account); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "provider init failed",
			"provider": account.Provider,
			"stage":    "init",
			"detail":   err.Error(),
		})
		return
	}

	result, err := p.ListObjects(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "list objects failed",
			"provider": account.Provider,
			"stage":    "listObjects",
			"detail":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": result})
}

func (h *Handler) ListDomains(c *gin.Context) {
	bucket := c.Param("bucket")
	accountID := c.Query("accountId")
	if accountID == "" || bucket == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId/bucket required"})
		return
	}

	account, err := h.accountWithSecret(accountID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
		return
	}

	provider, err := h.providers.Create(account.Provider)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err = provider.Init(account); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "provider init failed",
			"provider": account.Provider,
			"stage":    "init",
			"detail":   err.Error(),
		})
		return
	}

	specific, ok := provider.(storage.ProviderSpecific)
	if !ok {
		c.JSON(http.StatusOK, gin.H{"domains": []string{}})
		return
	}

	domains, err := specific.ListDomains(c.Request.Context(), bucket)
	if err != nil {
		var vErr *validationErr
		if errors.As(err, &vErr) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":    vErr.Error(),
				"provider": vErr.Provider,
				"stage":    vErr.Stage,
				"detail":   vErr.Detail(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"domains": domains})
}

// GetProviderFeatures 返回指定账户对应 provider 的功能列表。
func (h *Handler) GetProviderFeatures(c *gin.Context) {
	accountID := c.Param("id")
	if accountID == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{"error": "accountId required"},
		)
		return
	}

	provider, err := h.providerFromAccount(accountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	features := provider.GetProviderFeatures()
	c.JSON(http.StatusOK, gin.H{"features": features})
}
