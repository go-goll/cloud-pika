package services

import (
	"fmt"
	"strings"

	"github.com/goll/cloud-pika/internal/model"
)

// providerRule 描述某 provider 对可选字段的强制要求。
type providerRule struct {
	requireRegion      bool
	requireEndpoint    bool
	requireServiceName bool
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

// validationErr 携带校验失败的上下文（provider/阶段/原因）。
type validationErr struct {
	Provider string
	Stage    string
	Message  string
	Err      error
}

func (e *validationErr) Error() string {
	if e == nil {
		return ""
	}
	if e.Message != "" {
		return e.Message
	}
	if e.Err != nil {
		return e.Err.Error()
	}
	return "validation failed"
}

func newValidationErr(provider, stage, message string, cause error) *validationErr {
	return &validationErr{Provider: provider, Stage: stage, Message: message, Err: cause}
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
		return model.ProviderConfig{}, newValidationErr("", "payload", "provider is required", nil)
	}
	rule, ok := providerRules[cfg.Provider]
	if !ok {
		return model.ProviderConfig{}, newValidationErr(cfg.Provider, "payload", "unsupported provider", nil)
	}
	if cfg.Name == "" {
		return model.ProviderConfig{}, newValidationErr(cfg.Provider, "payload", "name is required", nil)
	}
	if cfg.AccessKey == "" {
		return model.ProviderConfig{}, newValidationErr(cfg.Provider, "payload", "accessKey is required", nil)
	}
	if cfg.SecretKey == "" {
		return model.ProviderConfig{}, newValidationErr(cfg.Provider, "payload", "secretKey is required", nil)
	}
	if rule.requireRegion && cfg.Region == "" {
		return model.ProviderConfig{}, newValidationErr(cfg.Provider, "payload",
			fmt.Sprintf("region is required for provider %s", cfg.Provider), nil)
	}
	if rule.requireEndpoint && cfg.Endpoint == "" {
		return model.ProviderConfig{}, newValidationErr(cfg.Provider, "payload",
			fmt.Sprintf("endpoint is required for provider %s", cfg.Provider), nil)
	}
	if rule.requireServiceName && cfg.ServiceName == "" {
		return model.ProviderConfig{}, newValidationErr(cfg.Provider, "payload",
			fmt.Sprintf("serviceName is required for provider %s", cfg.Provider), nil)
	}
	return cfg, nil
}
