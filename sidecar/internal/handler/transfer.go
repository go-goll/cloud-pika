package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListTransfers(c *gin.Context) {
	list, err := h.queue.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"transfers": list})
}

func (h *Handler) CancelTransfer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "transfer id required"})
		return
	}
	h.queue.Cancel(id)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
