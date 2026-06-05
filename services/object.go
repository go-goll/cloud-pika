package services

import (
	"context"
	"errors"
	"strings"

	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/model"
	"github.com/goll/cloud-pika/internal/queue"
	"github.com/goll/cloud-pika/internal/storage"
)

// ObjectService 暴露对象上传/下载/管理能力给前端绑定。
type ObjectService struct {
	deps *core.Deps
}

// NewObjectService 基于共享依赖构建对象服务。
func NewObjectService(deps *core.Deps) *ObjectService {
	return &ObjectService{deps: deps}
}

// TransferRef 标识一个已入队的传输任务。
type TransferRef struct {
	TransferID string `json:"transferId"` // 入队后生成的传输任务 ID
}

// URLResult 为生成的对象访问/签名 URL。
type URLResult struct {
	URL string `json:"url"` // 生成的 URL
}

// Upload 入队一个上传任务，返回传输任务引用。
func (s *ObjectService) Upload(p model.UploadParams) (TransferRef, error) {
	if p.AccountID == "" || p.Bucket == "" {
		return TransferRef{}, errors.New("accountId/bucket required")
	}
	provider, _, err := providerForAccount(s.deps, p.AccountID)
	if err != nil {
		return TransferRef{}, err
	}
	id, err := s.deps.Queue.Enqueue(queue.EnqueuePayload{
		Type:   "upload",
		Bucket: p.Bucket,
		Key:    p.Key,
		Run: func(ctx context.Context, notifyProgress func(progress int)) error {
			p.ProgressFn = notifyProgress
			return provider.UploadObject(ctx, p)
		},
	})
	if err != nil {
		return TransferRef{}, err
	}
	return TransferRef{TransferID: id}, nil
}

// Fetch 入队一个 URL 抓取上传任务，返回传输任务引用。
func (s *ObjectService) Fetch(p model.UploadParams) (TransferRef, error) {
	if p.AccountID == "" || p.Bucket == "" || p.SourceURL == "" {
		return TransferRef{}, errors.New("accountId/bucket/sourceUrl required")
	}
	provider, _, err := providerForAccount(s.deps, p.AccountID)
	if err != nil {
		return TransferRef{}, err
	}
	id, err := s.deps.Queue.Enqueue(queue.EnqueuePayload{
		Type:   "fetch",
		Bucket: p.Bucket,
		Key:    p.Key,
		Run: func(ctx context.Context, notifyProgress func(progress int)) error {
			p.ProgressFn = notifyProgress
			if fetcher, ok := provider.(storage.FetchProvider); ok {
				return fetcher.FetchURL(ctx, p)
			}
			return provider.UploadObject(ctx, p)
		},
	})
	if err != nil {
		return TransferRef{}, err
	}
	return TransferRef{TransferID: id}, nil
}

// Download 入队一个下载任务，返回传输任务引用。
func (s *ObjectService) Download(p model.DownloadParams) (TransferRef, error) {
	if p.AccountID == "" || p.Bucket == "" || p.Key == "" || p.LocalPath == "" {
		return TransferRef{}, errors.New("accountId/bucket/key/localPath required")
	}
	provider, _, err := providerForAccount(s.deps, p.AccountID)
	if err != nil {
		return TransferRef{}, err
	}
	id, err := s.deps.Queue.Enqueue(queue.EnqueuePayload{
		Type:   "download",
		Bucket: p.Bucket,
		Key:    p.Key,
		Run: func(ctx context.Context, notifyProgress func(progress int)) error {
			notifyProgress(16)
			if callErr := provider.DownloadObject(ctx, p); callErr != nil {
				return callErr
			}
			notifyProgress(95)
			return nil
		},
	})
	if err != nil {
		return TransferRef{}, err
	}
	return TransferRef{TransferID: id}, nil
}

// Rename 重命名对象。
func (s *ObjectService) Rename(p model.RenameParams) error {
	provider, _, err := providerForAccount(s.deps, p.AccountID)
	if err != nil {
		return err
	}
	return provider.RenameObject(context.Background(), p)
}

// CreateFolder 在对象存储中创建文件夹（以 / 结尾的空对象）。
func (s *ObjectService) CreateFolder(accountID, bucket, key string) error {
	if accountID == "" || bucket == "" || key == "" {
		return errors.New("accountId/bucket/key required")
	}
	if !strings.HasSuffix(key, "/") {
		key += "/"
	}
	provider, _, err := providerForAccount(s.deps, accountID)
	if err != nil {
		return err
	}
	params := model.UploadParams{AccountID: accountID, Bucket: bucket, Key: key}
	return provider.UploadObject(context.Background(), params)
}

// Delete 批量删除对象。
func (s *ObjectService) Delete(accountID, bucket string, keys []string) error {
	provider, _, err := providerForAccount(s.deps, accountID)
	if err != nil {
		return err
	}
	return provider.DeleteObjects(context.Background(), bucket, keys)
}

// GenerateURL 生成对象的访问/签名 URL。
func (s *ObjectService) GenerateURL(p model.SignedURLParams) (URLResult, error) {
	provider, _, err := providerForAccount(s.deps, p.AccountID)
	if err != nil {
		return URLResult{}, err
	}
	url, err := provider.GenerateURL(p)
	if err != nil {
		return URLResult{}, err
	}
	return URLResult{URL: url}, nil
}
