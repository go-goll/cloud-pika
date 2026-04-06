package ks3

import (
	"context"
	"fmt"
	"strings"

	"github.com/goll/cloud-pika/sidecar/internal/model"
	"github.com/goll/cloud-pika/sidecar/internal/storage/s3compat"
)

type Provider struct {
	base *s3compat.Provider
}

func New() *Provider {
	return &Provider{
		base: s3compat.New(
			"ks3",
			[]string{"paging"},
			s3compat.Options{
				ResolveEndpoint: func(cfg model.Account) string {
					region := strings.TrimSpace(cfg.Region)
					if region == "" {
						region = "cn-beijing"
					}
					return fmt.Sprintf("ks3-%s.ksyuncs.com", region)
				},
			},
		),
	}
}

func (p *Provider) Init(cfg model.Account) error { return p.base.Init(cfg) }

func (p *Provider) ListBuckets(ctx context.Context) ([]model.BucketInfo, error) {
	return p.base.ListBuckets(ctx)
}

func (p *Provider) ListObjects(ctx context.Context, params model.ListParams) (model.ListResult, error) {
	return p.base.ListObjects(ctx, params)
}

func (p *Provider) UploadObject(ctx context.Context, params model.UploadParams) error {
	return p.base.UploadObject(ctx, params)
}

func (p *Provider) DownloadObject(ctx context.Context, params model.DownloadParams) error {
	return p.base.DownloadObject(ctx, params)
}

func (p *Provider) DeleteObjects(ctx context.Context, bucket string, keys []string) error {
	return p.base.DeleteObjects(ctx, bucket, keys)
}

func (p *Provider) RenameObject(ctx context.Context, params model.RenameParams) error {
	return p.base.RenameObject(ctx, params)
}

func (p *Provider) GenerateURL(params model.SignedURLParams) (string, error) {
	return p.base.GenerateURL(params)
}

func (p *Provider) GetProviderFeatures() []string { return p.base.GetProviderFeatures() }
