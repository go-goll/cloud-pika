package services

import (
	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/model"
)

// SettingsService 暴露应用设置与 provider 功能查询能力给前端绑定。
type SettingsService struct {
	deps *core.Deps
}

// NewSettingsService 基于共享依赖构建设置服务。
func NewSettingsService(deps *core.Deps) *SettingsService {
	return &SettingsService{deps: deps}
}

// Get 返回应用设置。
func (s *SettingsService) Get() (model.AppSettings, error) {
	return s.deps.Settings.Get()
}

// Update 更新并返回应用设置，空字段回退为默认值。
func (s *SettingsService) Update(settings model.AppSettings) (model.AppSettings, error) {
	if settings.Language == "" {
		settings.Language = "system"
	}
	if settings.Theme == "" {
		settings.Theme = "system"
	}
	if settings.CopyType == "" {
		settings.CopyType = "url"
	}
	if err := s.deps.Settings.Save(settings); err != nil {
		return model.AppSettings{}, err
	}
	return settings, nil
}

// ProviderFeatures 返回指定账号对应 provider 的功能列表。
func (s *SettingsService) ProviderFeatures(accountID string) ([]string, error) {
	provider, _, err := providerForAccount(s.deps, accountID)
	if err != nil {
		return nil, err
	}
	return provider.GetProviderFeatures(), nil
}
