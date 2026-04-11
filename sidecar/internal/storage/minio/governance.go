package minio

import (
	"context"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func (p *Provider) GetLifecycleRules(ctx context.Context, bucket string) ([]model.LifecycleRule, error) {
	return p.base.GetLifecycleRules(ctx, bucket)
}

func (p *Provider) PutLifecycleRules(ctx context.Context, bucket string, rules []model.LifecycleRule) error {
	return p.base.PutLifecycleRules(ctx, bucket, rules)
}

func (p *Provider) DeleteLifecycleRules(ctx context.Context, bucket string) error {
	return p.base.DeleteLifecycleRules(ctx, bucket)
}

func (p *Provider) GetCORSRules(ctx context.Context, bucket string) ([]model.CORSRule, error) {
	return p.base.GetCORSRules(ctx, bucket)
}

func (p *Provider) PutCORSRules(ctx context.Context, bucket string, rules []model.CORSRule) error {
	return p.base.PutCORSRules(ctx, bucket, rules)
}

func (p *Provider) GetRefererConfig(ctx context.Context, bucket string) (*model.RefererConfig, error) {
	return p.base.GetRefererConfig(ctx, bucket)
}

func (p *Provider) PutRefererConfig(ctx context.Context, bucket string, cfg *model.RefererConfig) error {
	return p.base.PutRefererConfig(ctx, bucket, cfg)
}

func (p *Provider) GetEncryption(ctx context.Context, bucket string) (*model.EncryptionConfig, error) {
	return p.base.GetEncryption(ctx, bucket)
}

func (p *Provider) PutEncryption(ctx context.Context, bucket string, cfg *model.EncryptionConfig) error {
	return p.base.PutEncryption(ctx, bucket, cfg)
}

func (p *Provider) GetVersioning(ctx context.Context, bucket string) (string, error) {
	return p.base.GetVersioning(ctx, bucket)
}

func (p *Provider) PutVersioning(ctx context.Context, bucket string, enabled bool) error {
	return p.base.PutVersioning(ctx, bucket, enabled)
}

func (p *Provider) ListObjectVersions(ctx context.Context, params model.VersionListParams) (*model.VersionList, error) {
	return p.base.ListObjectVersions(ctx, params)
}
