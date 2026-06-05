package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/model"
	"github.com/goll/cloud-pika/internal/storage"
)

// BucketService 暴露存储桶与对象列举能力给前端绑定。
type BucketService struct {
	deps *core.Deps
}

// NewBucketService 基于共享依赖构建桶服务。
func NewBucketService(deps *core.Deps) *BucketService {
	return &BucketService{deps: deps}
}

// ListBuckets 列出指定账号下的所有桶。
func (s *BucketService) ListBuckets(provider, accountID string) ([]model.BucketInfo, error) {
	if provider == "" || accountID == "" {
		return nil, errors.New("provider/accountId required")
	}

	account, err := accountWithSecret(s.deps, accountID)
	if err != nil {
		return nil, err
	}
	if account.Provider != provider {
		return nil, errors.New("provider mismatch with account")
	}

	p, err := s.deps.Providers.Create(provider)
	if err != nil {
		return nil, err
	}
	if err = p.Init(account); err != nil {
		return nil, fmt.Errorf("provider init failed: %w", err)
	}

	s.deps.Queue.Publish("bucket.syncing", map[string]any{
		"provider":  provider,
		"accountId": accountID,
		"status":    "start",
	})
	buckets, err := p.ListBuckets(context.Background())
	if err != nil {
		return nil, fmt.Errorf("list buckets failed: %w", err)
	}
	s.deps.Queue.Publish("bucket.syncing", map[string]any{
		"provider":  provider,
		"accountId": accountID,
		"status":    "done",
		"count":     len(buckets),
	})

	return buckets, nil
}

// ListObjects 列出桶内对象（支持前缀/分页）。
func (s *BucketService) ListObjects(params model.ListParams) (model.ListResult, error) {
	if params.Bucket == "" {
		return model.ListResult{}, errors.New("bucket required")
	}
	if params.Limit <= 0 {
		params.Limit = 200
	}

	p, _, err := providerForAccount(s.deps, params.AccountID)
	if err != nil {
		return model.ListResult{}, err
	}

	result, err := p.ListObjects(context.Background(), params)
	if err != nil {
		return model.ListResult{}, fmt.Errorf("list objects failed: %w", err)
	}
	return result, nil
}

// ListDomains 返回桶绑定的 CDN 域名（provider 不支持 CDN 时返回空切片）。
func (s *BucketService) ListDomains(accountID, bucket string) ([]string, error) {
	if accountID == "" || bucket == "" {
		return nil, errors.New("accountId/bucket required")
	}

	provider, _, err := providerForAccount(s.deps, accountID)
	if err != nil {
		return nil, err
	}

	cdn, ok := provider.(storage.CDNProvider)
	if !ok {
		return []string{}, nil
	}

	domains, err := cdn.ListDomains(context.Background(), bucket)
	if err != nil {
		return nil, err
	}
	return domains, nil
}
