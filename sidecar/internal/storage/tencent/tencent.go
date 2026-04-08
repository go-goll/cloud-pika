package tencent

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/goll/cloud-pika/sidecar/internal/model"
	"github.com/goll/cloud-pika/sidecar/internal/storage/s3compat"
)

// Provider 腾讯云 COS 适配器。
// 腾讯云 ListBuckets 使用 service.cos.myqcloud.com，
// 但操作具体 bucket 必须使用 cos.{region}.myqcloud.com。
// 本适配器通过缓存 region 客户端解决这一差异。
type Provider struct {
	base    *s3compat.Provider
	account model.Account
	mu      sync.Mutex
	// regionClients 按 region 缓存的 s3compat 客户端
	regionClients map[string]*s3compat.Provider
}

func New() *Provider {
	return &Provider{
		regionClients: make(map[string]*s3compat.Provider),
	}
}

func (p *Provider) Init(cfg model.Account) error {
	p.account = cfg
	// 主客户端使用 service.cos.myqcloud.com（用于 ListBuckets）
	p.base = s3compat.New(
		"tencent",
		[]string{"urlUpload", "paging"},
		s3compat.Options{
			ResolveEndpoint: resolveEndpoint,
		},
	)
	return p.base.Init(cfg)
}

// regionClient 获取或创建指定 region 的客户端。
func (p *Provider) regionClient(
	region string,
) (*s3compat.Provider, error) {
	if region == "" {
		return p.base, nil
	}

	p.mu.Lock()
	defer p.mu.Unlock()

	if client, ok := p.regionClients[region]; ok {
		return client, nil
	}

	cfg := p.account
	cfg.Region = region
	// 强制使用 region-specific endpoint
	cfg.Endpoint = fmt.Sprintf(
		"cos.%s.myqcloud.com", region,
	)

	client := s3compat.New(
		"tencent",
		[]string{"urlUpload", "paging"},
		s3compat.Options{},
	)
	if err := client.Init(cfg); err != nil {
		return nil, fmt.Errorf(
			"init region client (%s) failed: %w",
			region, err,
		)
	}

	p.regionClients[region] = client
	return client, nil
}

// bucketClient 根据 bucket 获取正确 region 的客户端。
func (p *Provider) bucketClient(
	ctx context.Context,
	bucket string,
) (*s3compat.Provider, error) {
	// 如果账户已指定 region，直接使用
	if p.account.Region != "" {
		return p.regionClient(p.account.Region)
	}

	// 通过 GetBucketLocation 获取 bucket 的 region
	location, err := p.base.BucketLocation(ctx, bucket)
	if err != nil || location == "" {
		return p.base, nil
	}

	return p.regionClient(location)
}

func (p *Provider) ListBuckets(
	ctx context.Context,
) ([]model.BucketInfo, error) {
	return p.base.ListBuckets(ctx)
}

func (p *Provider) ListObjects(
	ctx context.Context,
	params model.ListParams,
) (model.ListResult, error) {
	client, err := p.bucketClient(ctx, params.Bucket)
	if err != nil {
		return model.ListResult{}, err
	}
	return client.ListObjects(ctx, params)
}

func (p *Provider) UploadObject(
	ctx context.Context,
	params model.UploadParams,
) error {
	client, err := p.bucketClient(ctx, params.Bucket)
	if err != nil {
		return err
	}
	return client.UploadObject(ctx, params)
}

func (p *Provider) DownloadObject(
	ctx context.Context,
	params model.DownloadParams,
) error {
	client, err := p.bucketClient(ctx, params.Bucket)
	if err != nil {
		return err
	}
	return client.DownloadObject(ctx, params)
}

func (p *Provider) DeleteObjects(
	ctx context.Context,
	bucket string,
	keys []string,
) error {
	client, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return err
	}
	return client.DeleteObjects(ctx, bucket, keys)
}

func (p *Provider) RenameObject(
	ctx context.Context,
	params model.RenameParams,
) error {
	client, err := p.bucketClient(ctx, params.Bucket)
	if err != nil {
		return err
	}
	return client.RenameObject(ctx, params)
}

func (p *Provider) GenerateURL(
	params model.SignedURLParams,
) (string, error) {
	return p.base.GenerateURL(params)
}

func (p *Provider) GetProviderFeatures() []string {
	return p.base.GetProviderFeatures()
}

func resolveEndpoint(cfg model.Account) string {
	region := strings.TrimSpace(cfg.Region)
	if region == "" {
		return "service.cos.myqcloud.com"
	}
	return fmt.Sprintf("cos.%s.myqcloud.com", region)
}
