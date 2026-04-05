package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func (h *Handler) GetSettings(c *gin.Context) {
	settings, err := h.settings.Get()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"settings": settings})
}

func (h *Handler) UpdateSettings(c *gin.Context) {
	var payload model.AppSettings
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if payload.Language == "" {
		payload.Language = "system"
	}
	if payload.Theme == "" {
		payload.Theme = "system"
	}
	if payload.CopyType == "" {
		payload.CopyType = "url"
	}

	if err := h.settings.Save(payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"settings": payload})
}
