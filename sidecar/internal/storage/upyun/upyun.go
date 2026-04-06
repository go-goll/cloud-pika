package upyun

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// Provider 又拍云适配器，使用独立实现占位。
type Provider struct {
	account model.Account
}

func New() *Provider { return &Provider{} }

func (p *Provider) Init(cfg model.Account) error {
	if strings.TrimSpace(cfg.ServiceName) == "" {
		return fmt.Errorf("serviceName is required for provider upyun")
	}
	if strings.TrimSpace(cfg.AccessKey) == "" || strings.TrimSpace(cfg.SecretKey) == "" {
		return fmt.Errorf("accessKey/secretKey required for provider upyun")
	}
	p.account = cfg
	return nil
}

func (p *Provider) ListBuckets(ctx context.Context) ([]model.BucketInfo, error) {
	usageURL := fmt.Sprintf("https://v0.api.upyun.com/%s/?usage", url.PathEscape(p.account.ServiceName))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, usageURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build upyun validation request failed: %w", err)
	}
	req.SetBasicAuth(p.account.AccessKey, p.account.SecretKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request upyun usage failed: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		msg := strings.TrimSpace(string(body))
		if msg == "" {
			msg = http.StatusText(resp.StatusCode)
		}
		return nil, fmt.Errorf("validate upyun account failed: %s", msg)
	}

	return []model.BucketInfo{{Name: p.account.ServiceName, Provider: "upyun"}}, nil
}

func (p *Provider) ListObjects(context.Context, model.ListParams) (model.ListResult, error) {
	return model.ListResult{}, fmt.Errorf("upyun object listing is not implemented yet")
}

func (p *Provider) UploadObject(context.Context, model.UploadParams) error {
	return fmt.Errorf("upyun upload is not implemented yet")
}

func (p *Provider) DownloadObject(context.Context, model.DownloadParams) error {
	return fmt.Errorf("upyun download is not implemented yet")
}

func (p *Provider) DeleteObjects(context.Context, string, []string) error {
	return fmt.Errorf("upyun delete is not implemented yet")
}

func (p *Provider) RenameObject(context.Context, model.RenameParams) error {
	return fmt.Errorf("upyun rename is not implemented yet")
}

func (p *Provider) GenerateURL(params model.SignedURLParams) (string, error) {
	if params.Domain == "" {
		return "", fmt.Errorf("domain required for upyun")
	}
	return fmt.Sprintf("https://%s/%s", params.Domain, params.Key), nil
}

func (p *Provider) GetProviderFeatures() []string {
	return []string{"customDomain"}
}

func (p *Provider) FetchURL(context.Context, model.UploadParams) error {
	return fmt.Errorf("upyun url-fetch upload is not implemented yet")
}

func (p *Provider) RefreshCDN(context.Context, []string) error {
	return fmt.Errorf("upyun cdn refresh is not implemented yet")
}

func (p *Provider) ListDomains(context.Context, string) ([]string, error) {
	return []string{}, nil
}
