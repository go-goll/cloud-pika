package server

import (
	"database/sql"
	"fmt"

	"github.com/goll/cloud-pika/sidecar/internal/config"
	"github.com/goll/cloud-pika/sidecar/internal/handler"
	"github.com/goll/cloud-pika/sidecar/internal/queue"
)

// HTTPServer 包装 sidecar HTTP 服务。
type HTTPServer struct {
	cfg    config.Config
	engine interface{ Run(addr ...string) error }
}

func New(cfg config.Config, db *sql.DB, hub *SSEHub, queueMgr *queue.Manager) *HTTPServer {
	h := handler.New(cfg, db, queueMgr)
	engine := buildRouter(cfg.Token, h, hub)
	return &HTTPServer{cfg: cfg, engine: engine}
}

func (s *HTTPServer) Run() error {
	addr := fmt.Sprintf("%s:%d", s.cfg.Host, s.cfg.Port)
	return s.engine.Run(addr)
}
