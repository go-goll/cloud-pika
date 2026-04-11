package s3compat

import (
	"testing"

	"github.com/minio/minio-go/v7/pkg/cors"
	"github.com/minio/minio-go/v7/pkg/lifecycle"
	"github.com/minio/minio-go/v7/pkg/sse"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func TestFromMinioLifecycle_ConvertsRules(t *testing.T) {
	cfg := &lifecycle.Configuration{
		Rules: []lifecycle.Rule{
			{
				ID:     "expire-tmp",
				Status: "Enabled",
				RuleFilter: lifecycle.Filter{
					Prefix: "tmp/",
				},
				Expiration: lifecycle.Expiration{
					Days: 30,
				},
			},
			{
				ID:     "archive-logs",
				Status: "Disabled",
				RuleFilter: lifecycle.Filter{
					Prefix: "logs/",
				},
				Transition: lifecycle.Transition{
					Days:         90,
					StorageClass: "GLACIER",
				},
			},
		},
	}

	rules := fromMinioLifecycle(cfg)
	if len(rules) != 2 {
		t.Fatalf("expected 2 rules, got %d", len(rules))
	}

	r0 := rules[0]
	if r0.ID != "expire-tmp" || !r0.Enabled || r0.Prefix != "tmp/" || r0.Expiration != 30 {
		t.Fatalf("rule[0] mismatch: %+v", r0)
	}
	if r0.Transition != nil {
		t.Fatal("rule[0] should not have transition")
	}

	r1 := rules[1]
	if r1.ID != "archive-logs" || r1.Enabled || r1.Prefix != "logs/" {
		t.Fatalf("rule[1] mismatch: %+v", r1)
	}
	if r1.Transition == nil || r1.Transition.Days != 90 || r1.Transition.StorageClass != "GLACIER" {
		t.Fatalf("rule[1] transition mismatch: %+v", r1.Transition)
	}
}

func TestToMinioLifecycle_ConvertsRules(t *testing.T) {
	rules := []model.LifecycleRule{
		{ID: "r1", Prefix: "img/", Enabled: true, Expiration: 7},
		{ID: "r2", Prefix: "vid/", Enabled: false, Transition: &model.LifecycleTransition{Days: 60, StorageClass: "IA"}},
	}

	cfg := toMinioLifecycle(rules)
	if len(cfg.Rules) != 2 {
		t.Fatalf("expected 2 rules, got %d", len(cfg.Rules))
	}
	if cfg.Rules[0].Status != "Enabled" || cfg.Rules[0].RuleFilter.Prefix != "img/" {
		t.Fatalf("rule[0] mismatch: %+v", cfg.Rules[0])
	}
	if cfg.Rules[1].Transition.StorageClass != "IA" {
		t.Fatalf("rule[1] transition mismatch: %+v", cfg.Rules[1].Transition)
	}
}

func TestFromMinioLifecycle_NilConfig(t *testing.T) {
	rules := fromMinioLifecycle(nil)
	if len(rules) != 0 {
		t.Fatal("expected empty slice")
	}
}

func TestFromMinioCORS_ConvertsRules(t *testing.T) {
	cfg := &cors.Config{
		CORSRules: []cors.Rule{
			{
				AllowedOrigin: []string{"*"},
				AllowedMethod: []string{"GET", "PUT"},
				AllowedHeader: []string{"Content-Type"},
				ExposeHeader:  []string{"ETag"},
				MaxAgeSeconds: 3600,
			},
		},
	}

	rules := fromMinioCORS(cfg)
	if len(rules) != 1 {
		t.Fatalf("expected 1 rule, got %d", len(rules))
	}
	r := rules[0]
	if r.AllowedOrigins[0] != "*" || r.MaxAgeSeconds != 3600 {
		t.Fatalf("rule mismatch: %+v", r)
	}
}

func TestToMinioCORS_ConvertsRules(t *testing.T) {
	rules := []model.CORSRule{{
		AllowedOrigins: []string{"https://example.com"},
		AllowedMethods: []string{"POST"},
		AllowedHeaders: []string{"*"},
		MaxAgeSeconds:  600,
	}}

	cfg := toMinioCORS(rules)
	if len(cfg.CORSRules) != 1 || cfg.CORSRules[0].AllowedOrigin[0] != "https://example.com" {
		t.Fatalf("unexpected config: %+v", cfg)
	}
}

func TestFromMinioEncryption_AES256(t *testing.T) {
	cfg := &sse.Configuration{
		Rules: []sse.Rule{{
			Apply: sse.ApplySSEByDefault{SSEAlgorithm: "AES256"},
		}},
	}
	result := fromMinioEncryption(cfg)
	if !result.Enabled || result.Algorithm != "AES256" {
		t.Fatalf("unexpected: %+v", result)
	}
}

func TestFromMinioEncryption_Nil(t *testing.T) {
	result := fromMinioEncryption(nil)
	if result.Enabled {
		t.Fatal("expected disabled")
	}
}

func TestToMinioEncryption_AES256(t *testing.T) {
	cfg := toMinioEncryption(&model.EncryptionConfig{Enabled: true, Algorithm: "AES256"})
	if len(cfg.Rules) != 1 || cfg.Rules[0].Apply.SSEAlgorithm != "AES256" {
		t.Fatalf("unexpected: %+v", cfg)
	}
}
