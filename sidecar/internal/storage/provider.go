package storage

import (
	"context"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// Provider 定义统一云存储接口。
type Provider interface {
	Init(cfg model.Account) error
	ListBuckets(ctx context.Context) ([]model.BucketInfo, error)
	ListObjects(ctx context.Context, params model.ListParams) (model.ListResult, error)
	UploadObject(ctx context.Context, params model.UploadParams) error
	DownloadObject(ctx context.Context, params model.DownloadParams) error
	DeleteObjects(ctx context.Context, bucket string, keys []string) error
	RenameObject(ctx context.Context, params model.RenameParams) error
	GenerateURL(params model.SignedURLParams) (string, error)
	GetProviderFeatures() []string
}

// ProviderFactory 抽象 Provider 工厂，支持测试注入。
type ProviderFactory interface {
	Create(provider string) (Provider, error)
}

// FetchProvider 支持 URL 抓取上传。
type FetchProvider interface {
	FetchURL(ctx context.Context, params model.UploadParams) error
}

// CDNProvider 定义 CDN 管理能力。
type CDNProvider interface {
	RefreshCDN(ctx context.Context, urls []string) error
	PrefetchCDN(ctx context.Context, urls []string) error
	ListDomains(ctx context.Context, bucket string) ([]string, error)
	GetRefreshQuota(ctx context.Context) (*model.CDNQuota, error)
}

// StorageConfigProvider 定义存储配置管理能力。
type StorageConfigProvider interface {
	GetLifecycleRules(ctx context.Context, bucket string) ([]model.LifecycleRule, error)
	PutLifecycleRules(ctx context.Context, bucket string, rules []model.LifecycleRule) error
	DeleteLifecycleRules(ctx context.Context, bucket string) error
	GetCORSRules(ctx context.Context, bucket string) ([]model.CORSRule, error)
	PutCORSRules(ctx context.Context, bucket string, rules []model.CORSRule) error
	GetRefererConfig(ctx context.Context, bucket string) (*model.RefererConfig, error)
	PutRefererConfig(ctx context.Context, bucket string, cfg *model.RefererConfig) error
	GetEncryption(ctx context.Context, bucket string) (*model.EncryptionConfig, error)
	PutEncryption(ctx context.Context, bucket string, cfg *model.EncryptionConfig) error
}

// VersioningProvider 定义版本管理能力。
type VersioningProvider interface {
	GetVersioning(ctx context.Context, bucket string) (string, error)
	PutVersioning(ctx context.Context, bucket string, enabled bool) error
	ListObjectVersions(ctx context.Context, params model.VersionListParams) (*model.VersionList, error)
}
