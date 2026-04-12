package handler

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/goll/cloud-pika/sidecar/internal/model"
	"github.com/goll/cloud-pika/sidecar/internal/storage"
)

// GetLifecycleRules 查询存储桶生命周期规则。
func (h *Handler) GetLifecycleRules(c *gin.Context) {
	bucket := c.Param("bucket")
	accountID := c.Query("accountId")
	if accountID == "" || bucket == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId/bucket required"})
		return
	}

	provider, err := h.providerFromAccount(accountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	scp, ok := provider.(storage.StorageConfigProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "lifecycle not supported"})
		return
	}

	rules, err := scp.GetLifecycleRules(c.Request.Context(), bucket)
	if err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"rules": rules})
}

type putLifecyclePayload struct {
	AccountID string                `json:"accountId"`
	Rules     []model.LifecycleRule `json:"rules"`
}

// PutLifecycleRules 设置存储桶生命周期规则。
func (h *Handler) PutLifecycleRules(c *gin.Context) {
	bucket := c.Param("bucket")

	var payload putLifecyclePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	scp, ok := provider.(storage.StorageConfigProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "lifecycle not supported"})
		return
	}

	if err = scp.PutLifecycleRules(c.Request.Context(), bucket, payload.Rules); err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// DeleteLifecycleRules 删除存储桶生命周期规则。
func (h *Handler) DeleteLifecycleRules(c *gin.Context) {
	bucket := c.Param("bucket")
	accountID := c.Query("accountId")
	if accountID == "" || bucket == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId/bucket required"})
		return
	}

	provider, err := h.providerFromAccount(accountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	scp, ok := provider.(storage.StorageConfigProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "lifecycle not supported"})
		return
	}

	if err = scp.DeleteLifecycleRules(c.Request.Context(), bucket); err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetCORSRules 查询存储桶 CORS 跨域规则。
func (h *Handler) GetCORSRules(c *gin.Context) {
	bucket := c.Param("bucket")
	accountID := c.Query("accountId")
	if accountID == "" || bucket == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId/bucket required"})
		return
	}

	provider, err := h.providerFromAccount(accountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	scp, ok := provider.(storage.StorageConfigProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "CORS not supported"})
		return
	}

	rules, err := scp.GetCORSRules(c.Request.Context(), bucket)
	if err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"rules": rules})
}

type putCORSPayload struct {
	AccountID string           `json:"accountId"`
	Rules     []model.CORSRule `json:"rules"`
}

// PutCORSRules 设置存储桶 CORS 跨域规则。
func (h *Handler) PutCORSRules(c *gin.Context) {
	bucket := c.Param("bucket")

	var payload putCORSPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	scp, ok := provider.(storage.StorageConfigProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "CORS not supported"})
		return
	}

	if err = scp.PutCORSRules(c.Request.Context(), bucket, payload.Rules); err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetRefererConfig 查询存储桶防盗链配置。
func (h *Handler) GetRefererConfig(c *gin.Context) {
	bucket := c.Param("bucket")
	accountID := c.Query("accountId")
	if accountID == "" || bucket == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId/bucket required"})
		return
	}

	provider, err := h.providerFromAccount(accountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	scp, ok := provider.(storage.StorageConfigProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "referer config not supported"})
		return
	}

	cfg, err := scp.GetRefererConfig(c.Request.Context(), bucket)
	if err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"config": cfg})
}

type putRefererPayload struct {
	AccountID string             `json:"accountId"`
	Config    model.RefererConfig `json:"config"`
}

// PutRefererConfig 设置存储桶防盗链配置。
func (h *Handler) PutRefererConfig(c *gin.Context) {
	bucket := c.Param("bucket")

	var payload putRefererPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	scp, ok := provider.(storage.StorageConfigProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "referer config not supported"})
		return
	}

	if err = scp.PutRefererConfig(c.Request.Context(), bucket, &payload.Config); err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetEncryption 查询存储桶加密配置。
func (h *Handler) GetEncryption(c *gin.Context) {
	bucket := c.Param("bucket")
	accountID := c.Query("accountId")
	if accountID == "" || bucket == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId/bucket required"})
		return
	}

	provider, err := h.providerFromAccount(accountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	scp, ok := provider.(storage.StorageConfigProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "encryption not supported"})
		return
	}

	cfg, err := scp.GetEncryption(c.Request.Context(), bucket)
	if err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"config": cfg})
}

type putEncryptionPayload struct {
	AccountID string                 `json:"accountId"`
	Config    model.EncryptionConfig `json:"config"`
}

// PutEncryption 设置存储桶加密配置。
func (h *Handler) PutEncryption(c *gin.Context) {
	bucket := c.Param("bucket")

	var payload putEncryptionPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	scp, ok := provider.(storage.StorageConfigProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "encryption not supported"})
		return
	}

	if err = scp.PutEncryption(c.Request.Context(), bucket, &payload.Config); err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetVersioning 查询存储桶版本控制状态。
func (h *Handler) GetVersioning(c *gin.Context) {
	bucket := c.Param("bucket")
	accountID := c.Query("accountId")
	if accountID == "" || bucket == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId/bucket required"})
		return
	}

	provider, err := h.providerFromAccount(accountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	vp, ok := provider.(storage.VersioningProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "versioning not supported"})
		return
	}

	status, err := vp.GetVersioning(c.Request.Context(), bucket)
	if err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": status})
}

type putVersioningPayload struct {
	AccountID string `json:"accountId"`
	Enabled   bool   `json:"enabled"`
}

// PutVersioning 设置存储桶版本控制状态。
func (h *Handler) PutVersioning(c *gin.Context) {
	bucket := c.Param("bucket")

	var payload putVersioningPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider, err := h.providerFromAccount(payload.AccountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	vp, ok := provider.(storage.VersioningProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "versioning not supported"})
		return
	}

	if err = vp.PutVersioning(c.Request.Context(), bucket, payload.Enabled); err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ListObjectVersions 查询对象历史版本列表。
func (h *Handler) ListObjectVersions(c *gin.Context) {
	bucket := c.Param("bucket")
	accountID := c.Query("accountId")
	if accountID == "" || bucket == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "accountId/bucket required",
		})
		return
	}

	provider, err := h.providerFromAccount(accountID)
	if err != nil {
		h.writeProviderErr(c, err)
		return
	}

	vp, ok := provider.(storage.VersioningProvider)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "versioning not supported",
		})
		return
	}

	limit := 100
	if v := c.Query("limit"); v != "" {
		fmt.Sscanf(v, "%d", &limit)
	}

	params := model.VersionListParams{
		AccountID:     accountID,
		Bucket:        bucket,
		Prefix:        c.Query("prefix"),
		KeyMarker:     c.Query("keyMarker"),
		VersionMarker: c.Query("versionMarker"),
		Limit:         limit,
	}
	result, err := vp.ListObjectVersions(
		c.Request.Context(), params,
	)
	if err != nil {
		if errors.Is(err, model.ErrNotSupported) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": result})
}
