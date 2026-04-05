package upyun

import (
	"context"
	"fmt"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// Provider 又拍云适配器，使用独立实现占位。
type Provider struct {
	account model.Account
}

func New() *Provider { return &Provider{} }

func (p *Provider) Init(cfg model.Account) error {
	p.account = cfg
	return nil
}

func (p *Provider) ListBuckets(context.Context) ([]model.BucketInfo, error) {
	return []model.BucketInfo{{Name: p.account.Name, Provider: "upyun"}}, nil
}

func (p *Provider) ListObjects(context.Context, model.ListParams) (model.ListResult, error) {
	return model.ListResult{Items: []model.ObjectItem{}, Truncated: false}, nil
}

func (p *Provider) UploadObject(context.Context, model.UploadParams) error { return nil }

func (p *Provider) DownloadObject(context.Context, model.DownloadParams) error { return nil }

func (p *Provider) DeleteObjects(context.Context, string, []string) error { return nil }

func (p *Provider) RenameObject(context.Context, model.RenameParams) error { return nil }

func (p *Provider) GenerateURL(params model.SignedURLParams) (string, error) {
	if params.Domain == "" {
		return "", fmt.Errorf("domain required for upyun")
	}
	return fmt.Sprintf("https://%s/%s", params.Domain, params.Key), nil
}

func (p *Provider) GetProviderFeatures() []string {
	return []string{"customDomain"}
}

func (p *Provider) FetchURL(context.Context, model.UploadParams) error { return nil }

func (p *Provider) RefreshCDN(context.Context, []string) error { return nil }

func (p *Provider) ListDomains(context.Context, string) ([]string, error) {
	return []string{}, nil
}
