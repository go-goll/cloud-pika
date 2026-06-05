package services

import (
	"context"
	"errors"

	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/model"
	"github.com/goll/cloud-pika/internal/storage"
)

// GovernanceService 暴露存储桶治理能力（生命周期/CORS/防盗链/加密/版本控制）给前端绑定。
type GovernanceService struct {
	deps *core.Deps
}

// NewGovernanceService 基于共享依赖构建治理服务。
func NewGovernanceService(deps *core.Deps) *GovernanceService {
	return &GovernanceService{deps: deps}
}

// LifecyclePayload 生命周期规则写入入参。
type LifecyclePayload struct {
	AccountID string                `json:"accountId"` // 账号 ID
	Bucket    string                `json:"bucket"`    // 存储桶名
	Rules     []model.LifecycleRule `json:"rules"`     // 生命周期规则集
}

// CORSPayload CORS 规则写入入参。
type CORSPayload struct {
	AccountID string           `json:"accountId"` // 账号 ID
	Bucket    string           `json:"bucket"`    // 存储桶名
	Rules     []model.CORSRule `json:"rules"`     // CORS 规则集
}

// RefererPayload 防盗链配置写入入参。
type RefererPayload struct {
	AccountID string              `json:"accountId"` // 账号 ID
	Bucket    string              `json:"bucket"`    // 存储桶名
	Config    model.RefererConfig `json:"config"`    // 防盗链配置
}

// EncryptionPayload 加密配置写入入参。
type EncryptionPayload struct {
	AccountID string                 `json:"accountId"` // 账号 ID
	Bucket    string                 `json:"bucket"`    // 存储桶名
	Config    model.EncryptionConfig `json:"config"`    // 加密配置
}

// storageConfigProvider 解析账号对应 provider 并断言为存储配置能力接口。
func (s *GovernanceService) storageConfigProvider(
	accountID string,
) (storage.StorageConfigProvider, error) {
	provider, _, err := providerForAccount(s.deps, accountID)
	if err != nil {
		return nil, err
	}
	scp, ok := provider.(storage.StorageConfigProvider)
	if !ok {
		return nil, errors.New("storage config not supported")
	}
	return scp, nil
}

// versioningProvider 解析账号对应 provider 并断言为版本控制能力接口。
func (s *GovernanceService) versioningProvider(
	accountID string,
) (storage.VersioningProvider, error) {
	provider, _, err := providerForAccount(s.deps, accountID)
	if err != nil {
		return nil, err
	}
	vp, ok := provider.(storage.VersioningProvider)
	if !ok {
		return nil, errors.New("versioning not supported")
	}
	return vp, nil
}

// GetLifecycle 查询存储桶生命周期规则。
func (s *GovernanceService) GetLifecycle(
	accountID, bucket string,
) ([]model.LifecycleRule, error) {
	scp, err := s.storageConfigProvider(accountID)
	if err != nil {
		return nil, err
	}
	return scp.GetLifecycleRules(context.Background(), bucket)
}

// PutLifecycle 设置存储桶生命周期规则。
func (s *GovernanceService) PutLifecycle(p LifecyclePayload) error {
	scp, err := s.storageConfigProvider(p.AccountID)
	if err != nil {
		return err
	}
	return scp.PutLifecycleRules(context.Background(), p.Bucket, p.Rules)
}

// DeleteLifecycle 删除存储桶生命周期规则。
func (s *GovernanceService) DeleteLifecycle(accountID, bucket string) error {
	scp, err := s.storageConfigProvider(accountID)
	if err != nil {
		return err
	}
	return scp.DeleteLifecycleRules(context.Background(), bucket)
}

// GetCORS 查询存储桶 CORS 跨域规则。
func (s *GovernanceService) GetCORS(accountID, bucket string) ([]model.CORSRule, error) {
	scp, err := s.storageConfigProvider(accountID)
	if err != nil {
		return nil, err
	}
	return scp.GetCORSRules(context.Background(), bucket)
}

// PutCORS 设置存储桶 CORS 跨域规则。
func (s *GovernanceService) PutCORS(p CORSPayload) error {
	scp, err := s.storageConfigProvider(p.AccountID)
	if err != nil {
		return err
	}
	return scp.PutCORSRules(context.Background(), p.Bucket, p.Rules)
}

// GetReferer 查询存储桶防盗链配置。
func (s *GovernanceService) GetReferer(accountID, bucket string) (model.RefererConfig, error) {
	scp, err := s.storageConfigProvider(accountID)
	if err != nil {
		return model.RefererConfig{}, err
	}
	cfg, err := scp.GetRefererConfig(context.Background(), bucket)
	if err != nil {
		return model.RefererConfig{}, err
	}
	if cfg == nil {
		return model.RefererConfig{}, nil
	}
	return *cfg, nil
}

// PutReferer 设置存储桶防盗链配置。
func (s *GovernanceService) PutReferer(p RefererPayload) error {
	scp, err := s.storageConfigProvider(p.AccountID)
	if err != nil {
		return err
	}
	return scp.PutRefererConfig(context.Background(), p.Bucket, &p.Config)
}

// GetEncryption 查询存储桶加密配置。
func (s *GovernanceService) GetEncryption(
	accountID, bucket string,
) (model.EncryptionConfig, error) {
	scp, err := s.storageConfigProvider(accountID)
	if err != nil {
		return model.EncryptionConfig{}, err
	}
	cfg, err := scp.GetEncryption(context.Background(), bucket)
	if err != nil {
		return model.EncryptionConfig{}, err
	}
	if cfg == nil {
		return model.EncryptionConfig{}, nil
	}
	return *cfg, nil
}

// PutEncryption 设置存储桶加密配置。
func (s *GovernanceService) PutEncryption(p EncryptionPayload) error {
	scp, err := s.storageConfigProvider(p.AccountID)
	if err != nil {
		return err
	}
	return scp.PutEncryption(context.Background(), p.Bucket, &p.Config)
}

// GetVersioning 查询存储桶版本控制状态，返回 "Enabled"/"Suspended"/""。
func (s *GovernanceService) GetVersioning(accountID, bucket string) (string, error) {
	vp, err := s.versioningProvider(accountID)
	if err != nil {
		return "", err
	}
	return vp.GetVersioning(context.Background(), bucket)
}

// PutVersioning 设置存储桶版本控制状态，status 为 "Enabled" 时开启，否则挂起。
func (s *GovernanceService) PutVersioning(accountID, bucket, status string) error {
	vp, err := s.versioningProvider(accountID)
	if err != nil {
		return err
	}
	return vp.PutVersioning(context.Background(), bucket, status == "Enabled")
}

// ListObjectVersions 查询对象历史版本列表。
func (s *GovernanceService) ListObjectVersions(
	p model.VersionListParams,
) (*model.VersionList, error) {
	vp, err := s.versioningProvider(p.AccountID)
	if err != nil {
		return nil, err
	}
	if p.Limit <= 0 {
		p.Limit = 100
	}
	return vp.ListObjectVersions(context.Background(), p)
}
