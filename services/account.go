package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/model"
)

// AccountService 暴露账号管理能力给前端绑定。
type AccountService struct {
	deps *core.Deps
}

// NewAccountService 基于共享依赖构建账号服务。
func NewAccountService(deps *core.Deps) *AccountService {
	return &AccountService{deps: deps}
}

// List 返回所有账号（密钥已脱敏）。
func (s *AccountService) List() ([]model.Account, error) {
	accounts, _, err := s.deps.Accounts.List()
	if err != nil {
		return nil, err
	}
	result := make([]model.Account, 0, len(accounts))
	for _, a := range accounts {
		a.SecretKey = ""
		result = append(result, a)
	}
	return result, nil
}

// Create 校验连通性后创建账号，返回脱敏账号。
func (s *AccountService) Create(payload model.ProviderConfig) (model.Account, error) {
	normalized, err := normalizeProviderConfig(payload)
	if err != nil {
		return model.Account{}, err
	}
	now := time.Now().UTC()
	account := model.Account{
		ID:          uuid.NewString(),
		Provider:    normalized.Provider,
		Name:        normalized.Name,
		AccessKey:   normalized.AccessKey,
		Endpoint:    normalized.Endpoint,
		Region:      normalized.Region,
		ServiceName: normalized.ServiceName,
		Internal:    normalized.Internal,
		Paging:      normalized.Paging,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	account.SecretKey = normalized.SecretKey
	if err = s.validateConnectivity(account); err != nil {
		return model.Account{}, err
	}
	encrypted, err := s.deps.Encryptor.Encrypt(normalized.SecretKey)
	if err != nil {
		return model.Account{}, err
	}
	if err = s.deps.Accounts.Create(account, encrypted); err != nil {
		return model.Account{}, err
	}
	account.SecretKey = ""
	return account, nil
}

// Update 更新账号；空密钥表示沿用原密钥。
func (s *AccountService) Update(id string, payload model.ProviderConfig) (model.Account, error) {
	if id == "" {
		return model.Account{}, errors.New("account id required")
	}
	old, encryptedSecret, err := s.deps.Accounts.FindByID(id)
	if err != nil {
		return model.Account{}, err
	}
	secret := strings.TrimSpace(payload.SecretKey)
	if secret == "" {
		if secret, err = s.deps.Encryptor.Decrypt(encryptedSecret); err != nil {
			return model.Account{}, err
		}
	}
	payload.SecretKey = secret
	normalized, err := normalizeProviderConfig(payload)
	if err != nil {
		return model.Account{}, err
	}
	updated := old
	updated.Provider = normalized.Provider
	updated.Name = normalized.Name
	updated.AccessKey = normalized.AccessKey
	updated.Endpoint = normalized.Endpoint
	updated.Region = normalized.Region
	updated.ServiceName = normalized.ServiceName
	updated.Internal = normalized.Internal
	updated.Paging = normalized.Paging
	updated.UpdatedAt = time.Now().UTC()
	updated.SecretKey = normalized.SecretKey
	if err = s.validateConnectivity(updated); err != nil {
		return model.Account{}, err
	}
	encrypted, err := s.deps.Encryptor.Encrypt(normalized.SecretKey)
	if err != nil {
		return model.Account{}, err
	}
	if err = s.deps.Accounts.Update(updated, encrypted); err != nil {
		return model.Account{}, err
	}
	updated.SecretKey = ""
	return updated, nil
}

// Delete 删除账号。
func (s *AccountService) Delete(id string) error {
	if id == "" {
		return errors.New("account id required")
	}
	return s.deps.Accounts.Delete(id)
}

// validateConnectivity 通过实际列举存储桶校验凭证可用性。
func (s *AccountService) validateConnectivity(account model.Account) error {
	provider, err := s.deps.Providers.Create(account.Provider)
	if err != nil {
		return fmt.Errorf("unsupported provider %s: %w", account.Provider, err)
	}
	if err = provider.Init(account); err != nil {
		return fmt.Errorf("provider init failed: %w", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	if _, err = provider.ListBuckets(ctx); err != nil {
		return fmt.Errorf("credential validation failed: %w", err)
	}
	return nil
}
