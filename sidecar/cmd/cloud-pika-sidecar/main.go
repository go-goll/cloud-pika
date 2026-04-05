package main

import (
	"log"

	"github.com/goll/cloud-pika/sidecar/internal/config"
	"github.com/goll/cloud-pika/sidecar/internal/database"
	"github.com/goll/cloud-pika/sidecar/internal/queue"
	"github.com/goll/cloud-pika/sidecar/internal/server"
)

func main() {
	cfg := config.Load()

	db, err := database.Open(cfg.DBPath)
	if err != nil {
		log.Fatalf("open database failed: %v", err)
	}
	defer db.Close()

	if err = database.Migrate(db); err != nil {
		log.Fatalf("run migration failed: %v", err)
	}

	hub := server.NewSSEHub()
	queueManager := queue.NewManager(db, hub)

	httpServer := server.New(cfg, db, hub, queueManager)
	if err = httpServer.Run(); err != nil {
		log.Fatalf("run server failed: %v", err)
	}
}
