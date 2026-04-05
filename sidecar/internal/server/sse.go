package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

// SSEMessage 表示推送给前端的事件。
type SSEMessage struct {
	Event string
	Data  []byte
}

// SSEHub 管理 SSE 连接与广播。
type SSEHub struct {
	mu      sync.RWMutex
	clients map[chan SSEMessage]struct{}
}

func NewSSEHub() *SSEHub {
	return &SSEHub{
		clients: make(map[chan SSEMessage]struct{}),
	}
}

func (h *SSEHub) register(client chan SSEMessage) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[client] = struct{}{}
}

func (h *SSEHub) unregister(client chan SSEMessage) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, client)
}

// Publish 向所有订阅端推送事件。
func (h *SSEHub) Publish(event string, payload any) {
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		select {
		case client <- SSEMessage{Event: event, Data: data}:
		default:
		}
	}
}

// Stream 处理 SSE 长连接。
func (h *SSEHub) Stream(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Status(http.StatusOK)

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "stream unsupported"})
		return
	}

	client := make(chan SSEMessage, 32)
	h.register(client)
	defer func() {
		h.unregister(client)
		close(client)
	}()

	_, _ = c.Writer.Write([]byte(": connected\n\n"))
	flusher.Flush()

	for {
		select {
		case msg := <-client:
			chunk := fmt.Sprintf("event: %s\ndata: %s\n\n", msg.Event, msg.Data)
			_, _ = c.Writer.Write([]byte(chunk))
			flusher.Flush()
		case <-c.Request.Context().Done():
			return
		}
	}
}
