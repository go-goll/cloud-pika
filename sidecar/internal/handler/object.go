package handler

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/goll/cloud-pika/sidecar/internal/model"
	"github.com/goll/cloud-pika/sidecar/internal/queue"
	"github.com/goll/cloud-pika/sidecar/internal/storage"
)

type deletePayload struct {
	AccountID string   `json:"accountId"`
	Bucket    string   `json:"bucket"`
	Keys      []string `json:"keys"`
}

func (h *Handler) UploadObject(c *gin.Context) {
	var payload model.UploadParams
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if payload.AccountID == "" || payload.Bucket == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId/bucket required"})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	id, err := h.queue.Enqueue(queue.EnqueuePayload{
		Type:   "upload",
		Bucket: payload.Bucket,
		Key:    payload.Key,
		Run: func(ctx context.Context, notifyProgress func(progress int)) error {
			notifyProgress(12)
			err := provider.UploadObject(ctx, payload)
			if err != nil {
				return err
			}
			notifyProgress(95)
			return nil
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"transferId": id})
}

func (h *Handler) FetchObject(c *gin.Context) {
	var payload model.UploadParams
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if payload.AccountID == "" || payload.Bucket == "" || payload.SourceURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId/bucket/sourceUrl required"})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	id, err := h.queue.Enqueue(queue.EnqueuePayload{
		Type:   "fetch",
		Bucket: payload.Bucket,
		Key:    payload.Key,
		Run: func(ctx context.Context, notifyProgress func(progress int)) error {
			notifyProgress(10)
			if specific, ok := provider.(storage.ProviderSpecific); ok {
				if callErr := specific.FetchURL(ctx, payload); callErr != nil {
					return callErr
				}
			} else {
				if callErr := provider.UploadObject(ctx, payload); callErr != nil {
					return callErr
				}
			}
			notifyProgress(95)
			return nil
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"transferId": id})
}

func (h *Handler) DownloadObject(c *gin.Context) {
	var payload model.DownloadParams
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if payload.AccountID == "" || payload.Bucket == "" || payload.Key == "" || payload.LocalPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId/bucket/key/localPath required"})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	id, err := h.queue.Enqueue(queue.EnqueuePayload{
		Type:   "download",
		Bucket: payload.Bucket,
		Key:    payload.Key,
		Run: func(ctx context.Context, notifyProgress func(progress int)) error {
			notifyProgress(16)
			if callErr := provider.DownloadObject(ctx, payload); callErr != nil {
				return callErr
			}
			notifyProgress(95)
			return nil
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"transferId": id})
}

func (h *Handler) RenameObject(c *gin.Context) {
	var payload model.RenameParams
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	if err = provider.RenameObject(c.Request.Context(), payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) DeleteObjects(c *gin.Context) {
	var payload deletePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	if err = provider.DeleteObjects(c.Request.Context(), payload.Bucket, payload.Keys); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) GenerateURL(c *gin.Context) {
	var payload model.SignedURLParams
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	url, err := provider.GenerateURL(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

func (h *Handler) RefreshCDN(c *gin.Context) {
	var payload struct {
		AccountID string   `json:"accountId"`
		URLs      []string `json:"urls"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	specific, ok := provider.(storage.ProviderSpecific)
	if !ok {
		c.JSON(http.StatusOK, gin.H{"ok": true})
		return
	}

	if err = specific.RefreshCDN(c.Request.Context(), payload.URLs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) providerFromAccount(accountID string) (storage.Provider, error) {
	account, err := h.accountWithSecret(accountID)
	if err != nil {
		return nil, err
	}

	provider, err := h.providers.Create(account.Provider)
	if err != nil {
		return nil, err
	}
	if err = provider.Init(account); err != nil {
		return nil, err
	}
	return provider, nil
}

func (h *Handler) writeProviderErr(c *gin.Context, err error) {
	if isNotFound(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
}
