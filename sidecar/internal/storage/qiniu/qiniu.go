package qiniu

import (
	"context"

	"github.com/goll/cloud-pika/sidecar/internal/model"
	"github.com/goll/cloud-pika/sidecar/internal/storage/s3compat"
)

// Provider 七牛适配器，基于 S3 兼容层并扩展特有能力。
type Provider struct {
	base *s3compat.Provider
}

func New() *Provider {
	return &Provider{
		base: s3compat.New("qiniu", []string{"urlUpload", "refreshCDN", "customDomain", "paging"}),
	}
}

func (p *Provider) Init(cfg model.Account) error {
	return p.base.Init(cfg)
}

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

func (p *Provider) GetProviderFeatures() []string {
	return p.base.GetProviderFeatures()
}

func (p *Provider) FetchURL(ctx context.Context, params model.UploadParams) error {
	return p.base.UploadObject(ctx, params)
}

func (p *Provider) RefreshCDN(context.Context, []string) error {
	return nil
}

func (p *Provider) ListDomains(context.Context, string) ([]string, error) {
	return []string{}, nil
}
