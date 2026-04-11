package server

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/goll/cloud-pika/sidecar/internal/handler"
)

func buildRouter(token string, h *handler.Handler, hub *SSEHub) *gin.Engine {
	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(gin.Logger())
	engine.Use(CORSMiddleware())

	engine.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := engine.Group("/api/v1")
	api.Use(AuthMiddleware(token))
	{
		api.GET("/events", hub.Stream)

		api.POST("/accounts", h.CreateAccount)
		api.GET("/accounts", h.ListAccounts)
		api.GET("/accounts/:id/features", h.GetProviderFeatures)
		api.PUT("/accounts/:id", h.UpdateAccount)
		api.DELETE("/accounts/:id", h.DeleteAccount)

		api.GET("/providers/:provider/buckets", h.ListBuckets)
		api.GET("/buckets/:bucket/objects", h.ListObjects)
		api.GET("/buckets/:bucket/domains", h.ListDomains)

		api.POST("/objects/upload", h.UploadObject)
		api.POST("/objects/download", h.DownloadObject)
		api.POST("/objects/fetch", h.FetchObject)
		api.POST("/objects/rename", h.RenameObject)
		api.POST("/objects/folder", h.CreateFolder)
		api.DELETE("/objects", h.DeleteObjects)
		api.POST("/objects/url", h.GenerateURL)
		api.POST("/cdn/refresh", h.RefreshCDN)
		api.POST("/cdn/prefetch", h.PrefetchCDN)
		api.GET("/cdn/quota", h.GetCDNQuota)

		api.GET("/buckets/:bucket/lifecycle", h.GetLifecycleRules)
		api.PUT("/buckets/:bucket/lifecycle", h.PutLifecycleRules)
		api.DELETE("/buckets/:bucket/lifecycle", h.DeleteLifecycleRules)
		api.GET("/buckets/:bucket/cors", h.GetCORSRules)
		api.PUT("/buckets/:bucket/cors", h.PutCORSRules)
		api.GET("/buckets/:bucket/referer", h.GetRefererConfig)
		api.PUT("/buckets/:bucket/referer", h.PutRefererConfig)
		api.GET("/buckets/:bucket/encryption", h.GetEncryption)
		api.PUT("/buckets/:bucket/encryption", h.PutEncryption)
		api.GET("/buckets/:bucket/versioning", h.GetVersioning)
		api.PUT("/buckets/:bucket/versioning", h.PutVersioning)

		api.GET("/transfers", h.ListTransfers)
		api.POST("/transfers/:id/cancel", h.CancelTransfer)

		api.GET("/settings", h.GetSettings)
		api.PUT("/settings", h.UpdateSettings)
	}

	return engine
}
