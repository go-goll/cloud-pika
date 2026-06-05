package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/goll/cloud-pika/internal/model"
)

// providerRule 描述某 provider 对可选字段的强制要求。
type providerRule struct {
	requireRegion      bool // 是否必须提供 Region
	requireEndpoint    bool // 是否必须提供 Endpoint
	requireServiceName bool // 是否必须提供 ServiceName
}

// 各 provider 的字段校验规则，键为归一化后的 provider 标识。
var providerRules = map[string]providerRule{
	"qiniu":    {},
	"tencent":  {},
	"aliyun":   {},
	"aws":      {requireRegion: true},
	"qingstor": {},
	"jd":       {requireRegion: true},
	"upyun":    {requireServiceName: true},
	"minio":    {requireEndpoint: true},
	"ks3":      {},
}

// normalizeProviderConfig 归一化并校验账号配置，返回清洗后的配置。
func normalizeProviderConfig(payload model.ProviderConfig) (model.ProviderConfig, error) {
	cfg := payload
	cfg.Provider = strings.TrimSpace(strings.ToLower(cfg.Provider))
	cfg.Name = strings.TrimSpace(cfg.Name)
	cfg.AccessKey = strings.TrimSpace(cfg.AccessKey)
	cfg.SecretKey = strings.TrimSpace(cfg.SecretKey)
	cfg.Endpoint = strings.TrimSpace(cfg.Endpoint)
	cfg.Region = strings.TrimSpace(cfg.Region)
	cfg.ServiceName = strings.TrimSpace(cfg.ServiceName)

	if cfg.Provider == "" {
		return model.ProviderConfig{}, errors.New("provider is required")
	}
	rule, ok := providerRules[cfg.Provider]
	if !ok {
		return model.ProviderConfig{}, fmt.Errorf("%s: unsupported provider", cfg.Provider)
	}
	if cfg.Name == "" {
		return model.ProviderConfig{}, fmt.Errorf("%s: name is required", cfg.Provider)
	}
	if cfg.AccessKey == "" {
		return model.ProviderConfig{}, fmt.Errorf("%s: accessKey is required", cfg.Provider)
	}
	if cfg.SecretKey == "" {
		return model.ProviderConfig{}, fmt.Errorf("%s: secretKey is required", cfg.Provider)
	}
	if rule.requireRegion && cfg.Region == "" {
		return model.ProviderConfig{}, fmt.Errorf("%s: region is required", cfg.Provider)
	}
	if rule.requireEndpoint && cfg.Endpoint == "" {
		return model.ProviderConfig{}, fmt.Errorf("%s: endpoint is required", cfg.Provider)
	}
	if rule.requireServiceName && cfg.ServiceName == "" {
		return model.ProviderConfig{}, fmt.Errorf("%s: serviceName is required", cfg.Provider)
	}
	return cfg, nil
}
