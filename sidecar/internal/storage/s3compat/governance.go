package s3compat

import (
	"context"
	"fmt"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/cors"
	"github.com/minio/minio-go/v7/pkg/lifecycle"
	"github.com/minio/minio-go/v7/pkg/sse"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// GetLifecycleRules 获取 Bucket 生命周期规则。
func (p *Provider) GetLifecycleRules(ctx context.Context, bucket string) ([]model.LifecycleRule, error) {
	cfg, err := p.client.GetBucketLifecycle(ctx, bucket)
	if err != nil {
		resp := minio.ToErrorResponse(err)
		if resp.Code == "NoSuchLifecycleConfiguration" {
			return []model.LifecycleRule{}, nil
		}
		return nil, fmt.Errorf("get lifecycle failed: %w", err)
	}
	return fromMinioLifecycle(cfg), nil
}

// PutLifecycleRules 设置 Bucket 生命周期规则。
func (p *Provider) PutLifecycleRules(ctx context.Context, bucket string, rules []model.LifecycleRule) error {
	cfg := toMinioLifecycle(rules)
	if err := p.client.SetBucketLifecycle(ctx, bucket, cfg); err != nil {
		return fmt.Errorf("put lifecycle failed: %w", err)
	}
	return nil
}

// DeleteLifecycleRules 删除 Bucket 生命周期配置。
func (p *Provider) DeleteLifecycleRules(ctx context.Context, bucket string) error {
	if err := p.client.SetBucketLifecycle(ctx, bucket, &lifecycle.Configuration{}); err != nil {
		return fmt.Errorf("delete lifecycle failed: %w", err)
	}
	return nil
}

// GetCORSRules 获取 Bucket CORS 配置。
func (p *Provider) GetCORSRules(ctx context.Context, bucket string) ([]model.CORSRule, error) {
	cfg, err := p.client.GetBucketCors(ctx, bucket)
	if err != nil {
		resp := minio.ToErrorResponse(err)
		if resp.Code == "NoSuchCORSConfiguration" {
			return []model.CORSRule{}, nil
		}
		return nil, fmt.Errorf("get cors failed: %w", err)
	}
	return fromMinioCORS(cfg), nil
}

// PutCORSRules 设置 Bucket CORS 配置。
func (p *Provider) PutCORSRules(ctx context.Context, bucket string, rules []model.CORSRule) error {
	cfg := toMinioCORS(rules)
	if err := p.client.SetBucketCors(ctx, bucket, cfg); err != nil {
		return fmt.Errorf("put cors failed: %w", err)
	}
	return nil
}

// GetRefererConfig S3 不原生支持 referer 配置。
func (p *Provider) GetRefererConfig(_ context.Context, _ string) (*model.RefererConfig, error) {
	return nil, model.ErrNotSupported
}

// PutRefererConfig S3 不原生支持 referer 配置。
func (p *Provider) PutRefererConfig(_ context.Context, _ string, _ *model.RefererConfig) error {
	return model.ErrNotSupported
}

// GetEncryption 获取 Bucket 默认加密配置。
func (p *Provider) GetEncryption(ctx context.Context, bucket string) (*model.EncryptionConfig, error) {
	cfg, err := p.client.GetBucketEncryption(ctx, bucket)
	if err != nil {
		return &model.EncryptionConfig{Enabled: false}, nil
	}
	return fromMinioEncryption(cfg), nil
}

// PutEncryption 设置 Bucket 默认加密配置。
func (p *Provider) PutEncryption(ctx context.Context, bucket string, cfg *model.EncryptionConfig) error {
	if !cfg.Enabled {
		if err := p.client.RemoveBucketEncryption(ctx, bucket); err != nil {
			return fmt.Errorf("remove encryption failed: %w", err)
		}
		return nil
	}
	sseCfg := toMinioEncryption(cfg)
	if err := p.client.SetBucketEncryption(ctx, bucket, sseCfg); err != nil {
		return fmt.Errorf("put encryption failed: %w", err)
	}
	return nil
}

// ---- 数据转换函数 ----

func fromMinioLifecycle(cfg *lifecycle.Configuration) []model.LifecycleRule {
	if cfg == nil {
		return []model.LifecycleRule{}
	}
	rules := make([]model.LifecycleRule, 0, len(cfg.Rules))
	for _, r := range cfg.Rules {
		rule := model.LifecycleRule{
			ID:      r.ID,
			Prefix:  r.RuleFilter.And.Prefix,
			Enabled: r.Status == "Enabled",
		}
		if rule.Prefix == "" {
			rule.Prefix = r.RuleFilter.Prefix
		}
		if r.Expiration.Days > 0 {
			rule.Expiration = int(r.Expiration.Days)
		}
		if r.Transition.StorageClass != "" {
			rule.Transition = &model.LifecycleTransition{
				Days:         int(r.Transition.Days),
				StorageClass: r.Transition.StorageClass,
			}
		}
		rules = append(rules, rule)
	}
	return rules
}

func toMinioLifecycle(rules []model.LifecycleRule) *lifecycle.Configuration {
	cfg := &lifecycle.Configuration{}
	for _, r := range rules {
		status := "Disabled"
		if r.Enabled {
			status = "Enabled"
		}
		rule := lifecycle.Rule{
			ID:     r.ID,
			Status: status,
			RuleFilter: lifecycle.Filter{
				Prefix: r.Prefix,
			},
		}
		if r.Expiration > 0 {
			rule.Expiration = lifecycle.Expiration{
				Days: lifecycle.ExpirationDays(r.Expiration),
			}
		}
		if r.Transition != nil {
			rule.Transition = lifecycle.Transition{
				Days:         lifecycle.ExpirationDays(r.Transition.Days),
				StorageClass: r.Transition.StorageClass,
			}
		}
		cfg.Rules = append(cfg.Rules, rule)
	}
	return cfg
}

func fromMinioCORS(cfg *cors.Config) []model.CORSRule {
	if cfg == nil {
		return []model.CORSRule{}
	}
	rules := make([]model.CORSRule, 0, len(cfg.CORSRules))
	for _, r := range cfg.CORSRules {
		rules = append(rules, model.CORSRule{
			AllowedOrigins: r.AllowedOrigin,
			AllowedMethods: r.AllowedMethod,
			AllowedHeaders: r.AllowedHeader,
			ExposeHeaders:  r.ExposeHeader,
			MaxAgeSeconds:  r.MaxAgeSeconds,
		})
	}
	return rules
}

func toMinioCORS(rules []model.CORSRule) *cors.Config {
	cfg := &cors.Config{}
	for _, r := range rules {
		cfg.CORSRules = append(cfg.CORSRules, cors.Rule{
			AllowedOrigin: r.AllowedOrigins,
			AllowedMethod: r.AllowedMethods,
			AllowedHeader: r.AllowedHeaders,
			ExposeHeader:  r.ExposeHeaders,
			MaxAgeSeconds: r.MaxAgeSeconds,
		})
	}
	return cfg
}

func fromMinioEncryption(cfg *sse.Configuration) *model.EncryptionConfig {
	if cfg == nil || len(cfg.Rules) == 0 {
		return &model.EncryptionConfig{Enabled: false}
	}
	rule := cfg.Rules[0]
	return &model.EncryptionConfig{
		Enabled:   true,
		Algorithm: rule.Apply.SSEAlgorithm,
		KMSKeyID:  rule.Apply.KmsMasterKeyID,
	}
}

func toMinioEncryption(cfg *model.EncryptionConfig) *sse.Configuration {
	return &sse.Configuration{
		Rules: []sse.Rule{{
			Apply: sse.ApplySSEByDefault{
				SSEAlgorithm:   cfg.Algorithm,
				KmsMasterKeyID: cfg.KMSKeyID,
			},
		}},
	}
}
