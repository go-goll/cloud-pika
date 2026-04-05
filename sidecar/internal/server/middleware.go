package server

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware 验证 Bearer token 或 query token。
func AuthMiddleware(token string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := strings.TrimSpace(c.GetHeader("Authorization"))
		queryToken := strings.TrimSpace(c.Query("token"))

		if header == "" && queryToken == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing auth token"})
			return
		}

		if header != "" {
			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" || parts[1] != token {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid bearer token"})
				return
			}
		}

		if queryToken != "" && queryToken != token {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid query token"})
			return
		}

		c.Next()
	}
}
