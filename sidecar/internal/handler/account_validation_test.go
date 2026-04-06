package handler

import (
	"testing"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func TestNormalizeProviderConfigRules(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		payload   model.ProviderConfig
		wantError bool
	}{
		{
			name: "qiniu-no-endpoint-region-is-valid",
			payload: model.ProviderConfig{
				Provider:  "qiniu",
				Name:      "qiniu",
				AccessKey: "ak",
				SecretKey: "sk",
			},
		},
		{
			name: "aws-requires-region",
			payload: model.ProviderConfig{
				Provider:  "aws",
				Name:      "aws",
				AccessKey: "ak",
				SecretKey: "sk",
			},
			wantError: true,
		},
		{
			name: "minio-requires-endpoint",
			payload: model.ProviderConfig{
				Provider:  "minio",
				Name:      "minio",
				AccessKey: "ak",
				SecretKey: "sk",
			},
			wantError: true,
		},
		{
			name: "upyun-requires-service-name",
			payload: model.ProviderConfig{
				Provider:  "upyun",
				Name:      "upyun",
				AccessKey: "operator",
				SecretKey: "password",
			},
			wantError: true,
		},
		{
			name: "provider-name-is-normalized",
			payload: model.ProviderConfig{
				Provider:  "  AWS  ",
				Name:      "aws",
				AccessKey: "ak",
				SecretKey: "sk",
				Region:    "us-east-1",
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			normalized, err := normalizeProviderConfig(tt.payload)
			if tt.wantError {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if tt.name == "provider-name-is-normalized" && normalized.Provider != "aws" {
				t.Fatalf("expected provider aws, got %s", normalized.Provider)
			}
		})
	}
}
