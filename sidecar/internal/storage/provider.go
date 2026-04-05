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

// ProviderSpecific 定义厂商扩展能力。
type ProviderSpecific interface {
	FetchURL(ctx context.Context, params model.UploadParams) error
	RefreshCDN(ctx context.Context, urls []string) error
	ListDomains(ctx context.Context, bucket string) ([]string, error)
}
