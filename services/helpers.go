package services

import (
	"fmt"

	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/model"
	"github.com/goll/cloud-pika/internal/storage"
)

// accountWithSecret 加载账号并解密其密钥，返回含明文 SecretKey 的账号。
// 多个绑定服务在调用 provider 前都需要先拿到带密钥的账号。
func accountWithSecret(deps *core.Deps, id string) (model.Account, error) {
	account, encrypted, err := deps.Accounts.FindByID(id)
	if err != nil {
		return model.Account{}, err
	}
	if encrypted != "" {
		secret, decErr := deps.Encryptor.Decrypt(encrypted)
		if decErr != nil {
			return model.Account{}, decErr
		}
		account.SecretKey = secret
	}
	return account, nil
}

// providerForAccount 加载账号并初始化对应的云存储 provider，
// 返回就绪的 provider 及其账号（账号含明文密钥，供调用方按需使用）。
func providerForAccount(deps *core.Deps, accountID string) (storage.Provider, model.Account, error) {
	account, err := accountWithSecret(deps, accountID)
	if err != nil {
		return nil, model.Account{}, err
	}
	provider, err := deps.Providers.Create(account.Provider)
	if err != nil {
		return nil, model.Account{}, fmt.Errorf("%s: unsupported provider: %w", account.Provider, err)
	}
	if err = provider.Init(account); err != nil {
		return nil, model.Account{}, fmt.Errorf("%s: provider init failed: %w", account.Provider, err)
	}
	return provider, account, nil
}
