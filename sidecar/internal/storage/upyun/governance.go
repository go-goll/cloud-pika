package upyun

import (
	"context"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// GetLifecycleRules 又拍云不支持生命周期规则查询。
func (p *Provider) GetLifecycleRules(_ context.Context, _ string) ([]model.LifecycleRule, error) {
	return nil, model.ErrNotSupported
}

// PutLifecycleRules 又拍云不支持生命周期规则设置。
func (p *Provider) PutLifecycleRules(_ context.Context, _ string, _ []model.LifecycleRule) error {
	return model.ErrNotSupported
}

// DeleteLifecycleRules 又拍云不支持生命周期规则删除。
func (p *Provider) DeleteLifecycleRules(_ context.Context, _ string) error {
	return model.ErrNotSupported
}

// GetCORSRules 又拍云不支持 CORS 规则查询。
func (p *Provider) GetCORSRules(_ context.Context, _ string) ([]model.CORSRule, error) {
	return nil, model.ErrNotSupported
}

// PutCORSRules 又拍云不支持 CORS 规则设置。
func (p *Provider) PutCORSRules(_ context.Context, _ string, _ []model.CORSRule) error {
	return model.ErrNotSupported
}

// GetRefererConfig 又拍云不支持防盗链配置查询。
func (p *Provider) GetRefererConfig(_ context.Context, _ string) (*model.RefererConfig, error) {
	return nil, model.ErrNotSupported
}

// PutRefererConfig 又拍云不支持防盗链配置设置。
func (p *Provider) PutRefererConfig(_ context.Context, _ string, _ *model.RefererConfig) error {
	return model.ErrNotSupported
}

// GetEncryption 又拍云不支持加密配置查询。
func (p *Provider) GetEncryption(_ context.Context, _ string) (*model.EncryptionConfig, error) {
	return nil, model.ErrNotSupported
}

// PutEncryption 又拍云不支持加密配置设置。
func (p *Provider) PutEncryption(_ context.Context, _ string, _ *model.EncryptionConfig) error {
	return model.ErrNotSupported
}

// GetVersioning 又拍云不支持版本管理查询。
func (p *Provider) GetVersioning(_ context.Context, _ string) (string, error) {
	return "", model.ErrNotSupported
}

// PutVersioning 又拍云不支持版本管理设置。
func (p *Provider) PutVersioning(_ context.Context, _ string, _ bool) error {
	return model.ErrNotSupported
}

// ListObjectVersions 又拍云不支持对象版本列表查询。
func (p *Provider) ListObjectVersions(_ context.Context, _ model.VersionListParams) (*model.VersionList, error) {
	return nil, model.ErrNotSupported
}
