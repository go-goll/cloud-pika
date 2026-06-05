package services

import (
	"context"
	"errors"

	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/model"
	"github.com/goll/cloud-pika/internal/storage"
)

// CDNService 暴露 CDN 刷新/预热/配额能力给前端绑定。
type CDNService struct {
	deps *core.Deps
}

// NewCDNService 基于共享依赖构建 CDN 服务。
func NewCDNService(deps *core.Deps) *CDNService {
	return &CDNService{deps: deps}
}

// Refresh 刷新 CDN 缓存。Provider 不支持 CDN 时静默成功（与原 handler 行为一致）。
func (s *CDNService) Refresh(accountID string, urls []string) error {
	provider, _, err := providerForAccount(s.deps, accountID)
	if err != nil {
		return err
	}
	cdn, ok := provider.(storage.CDNProvider)
	if !ok {
		return nil
	}
	return cdn.RefreshCDN(context.Background(), urls)
}

// Prefetch 预热 CDN。Provider 不支持 CDN 时返回错误。
func (s *CDNService) Prefetch(accountID string, urls []string) error {
	provider, _, err := providerForAccount(s.deps, accountID)
	if err != nil {
		return err
	}
	cdn, ok := provider.(storage.CDNProvider)
	if !ok {
		return errors.New("CDN not supported")
	}
	return cdn.PrefetchCDN(context.Background(), urls)
}

// Quota 查询 CDN 刷新/预热每日配额，失败返回 nil（前端容错）。
func (s *CDNService) Quota(accountID string) (*model.CDNQuota, error) {
	provider, _, err := providerForAccount(s.deps, accountID)
	if err != nil {
		return nil, nil
	}
	cdn, ok := provider.(storage.CDNProvider)
	if !ok {
		return nil, nil
	}
	quota, err := cdn.GetRefreshQuota(context.Background())
	if err != nil {
		return nil, nil
	}
	return quota, nil
}
