package tencent

import (
	"context"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func (p *Provider) GetLifecycleRules(ctx context.Context, bucket string) ([]model.LifecycleRule, error) {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return nil, err
	}
	return c.GetLifecycleRules(ctx, bucket)
}

func (p *Provider) PutLifecycleRules(ctx context.Context, bucket string, rules []model.LifecycleRule) error {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return err
	}
	return c.PutLifecycleRules(ctx, bucket, rules)
}

func (p *Provider) DeleteLifecycleRules(ctx context.Context, bucket string) error {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return err
	}
	return c.DeleteLifecycleRules(ctx, bucket)
}

func (p *Provider) GetCORSRules(ctx context.Context, bucket string) ([]model.CORSRule, error) {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return nil, err
	}
	return c.GetCORSRules(ctx, bucket)
}

func (p *Provider) PutCORSRules(ctx context.Context, bucket string, rules []model.CORSRule) error {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return err
	}
	return c.PutCORSRules(ctx, bucket, rules)
}

func (p *Provider) GetRefererConfig(ctx context.Context, bucket string) (*model.RefererConfig, error) {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return nil, err
	}
	return c.GetRefererConfig(ctx, bucket)
}

func (p *Provider) PutRefererConfig(ctx context.Context, bucket string, cfg *model.RefererConfig) error {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return err
	}
	return c.PutRefererConfig(ctx, bucket, cfg)
}

func (p *Provider) GetEncryption(ctx context.Context, bucket string) (*model.EncryptionConfig, error) {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return nil, err
	}
	return c.GetEncryption(ctx, bucket)
}

func (p *Provider) PutEncryption(ctx context.Context, bucket string, cfg *model.EncryptionConfig) error {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return err
	}
	return c.PutEncryption(ctx, bucket, cfg)
}

func (p *Provider) GetVersioning(ctx context.Context, bucket string) (string, error) {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return "", err
	}
	return c.GetVersioning(ctx, bucket)
}

func (p *Provider) PutVersioning(ctx context.Context, bucket string, enabled bool) error {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return err
	}
	return c.PutVersioning(ctx, bucket, enabled)
}

func (p *Provider) ListObjectVersions(ctx context.Context, params model.VersionListParams) (*model.VersionList, error) {
	c, err := p.bucketClient(ctx, params.Bucket)
	if err != nil {
		return nil, err
	}
	return c.ListObjectVersions(ctx, params)
}
