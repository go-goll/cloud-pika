package s3compat

import (
	"testing"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func TestGenerateURLFallback(t *testing.T) {
	provider := New("aws", []string{"paging"}, Options{})

	url, err := provider.GenerateURL(model.SignedURLParams{
		Key:    "abc/file.png",
		Domain: "cdn.example.com",
		HTTPS:  true,
	})
	if err != nil {
		t.Fatalf("generate url failed: %v", err)
	}
	if url != "https://cdn.example.com/abc/file.png" {
		t.Fatalf("unexpected url: %s", url)
	}
}
