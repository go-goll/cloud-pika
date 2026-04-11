package storage_test

import (
	"github.com/goll/cloud-pika/sidecar/internal/storage"
	"github.com/goll/cloud-pika/sidecar/internal/storage/qiniu"
	"github.com/goll/cloud-pika/sidecar/internal/storage/s3compat"
	"github.com/goll/cloud-pika/sidecar/internal/storage/upyun"
)

// 编译时接口一致性检查 — 确保各厂商实现预期接口。

// 七牛: Provider + CDNProvider + FetchProvider
var (
	_ storage.Provider      = (*qiniu.Provider)(nil)
	_ storage.CDNProvider   = (*qiniu.Provider)(nil)
	_ storage.FetchProvider = (*qiniu.Provider)(nil)
)

// 又拍: Provider + CDNProvider + FetchProvider
var (
	_ storage.Provider      = (*upyun.Provider)(nil)
	_ storage.CDNProvider   = (*upyun.Provider)(nil)
	_ storage.FetchProvider = (*upyun.Provider)(nil)
)

// S3 兼容层: Provider + StorageConfigProvider + VersioningProvider
var (
	_ storage.Provider              = (*s3compat.Provider)(nil)
	_ storage.StorageConfigProvider = (*s3compat.Provider)(nil)
	_ storage.VersioningProvider    = (*s3compat.Provider)(nil)
)

// Factory 实现 ProviderFactory
var _ storage.ProviderFactory = storage.Factory{}
