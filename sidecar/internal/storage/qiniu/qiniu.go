package qiniu

import (
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/goll/cloud-pika/sidecar/internal/model"
	"github.com/goll/cloud-pika/sidecar/internal/storage/s3compat"
)

// Provider 七牛适配器，基于 S3 兼容层并扩展特有能力。
type Provider struct {
	base    *s3compat.Provider
	account model.Account
}

func New() *Provider {
	return &Provider{
		base: s3compat.New(
			"qiniu",
			[]string{"urlUpload", "refreshCDN", "customDomain", "paging"},
			s3compat.Options{
				ResolveEndpoint: func(cfg model.Account) string {
					region := strings.TrimSpace(cfg.Region)
					if region == "" {
						region = "cn-east-1"
					}
					return fmt.Sprintf("s3-%s.qiniucs.com", region)
				},
			},
		),
	}
}

func (p *Provider) Init(cfg model.Account) error {
	p.account = cfg
	return p.base.Init(cfg)
}

func (p *Provider) ListBuckets(ctx context.Context) ([]model.BucketInfo, error) {
	token, err := qboxAccessToken(p.account.AccessKey, p.account.SecretKey, qiniuBucketListURL)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, qiniuBucketListURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build qiniu bucket request failed: %w", err)
	}
	req.Header.Set("Authorization", "QBox "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request qiniu buckets failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read qiniu buckets response failed: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		msg := strings.TrimSpace(string(body))
		if msg == "" {
			msg = http.StatusText(resp.StatusCode)
		}
		return nil, fmt.Errorf("qiniu buckets failed: %s", msg)
	}

	names := parseQiniuBucketNames(body)
	result := make([]model.BucketInfo, 0, len(names))
	for _, name := range names {
		result = append(result, model.BucketInfo{
			Name:     name,
			Provider: "qiniu",
		})
	}
	return result, nil
}

func (p *Provider) ListObjects(ctx context.Context, params model.ListParams) (model.ListResult, error) {
	return p.base.ListObjects(ctx, params)
}

func (p *Provider) UploadObject(ctx context.Context, params model.UploadParams) error {
	return p.base.UploadObject(ctx, params)
}

func (p *Provider) DownloadObject(ctx context.Context, params model.DownloadParams) error {
	return p.base.DownloadObject(ctx, params)
}

func (p *Provider) DeleteObjects(ctx context.Context, bucket string, keys []string) error {
	return p.base.DeleteObjects(ctx, bucket, keys)
}

func (p *Provider) RenameObject(ctx context.Context, params model.RenameParams) error {
	return p.base.RenameObject(ctx, params)
}

func (p *Provider) GenerateURL(params model.SignedURLParams) (string, error) {
	return p.base.GenerateURL(params)
}

func (p *Provider) GetProviderFeatures() []string {
	return p.base.GetProviderFeatures()
}

func (p *Provider) FetchURL(ctx context.Context, params model.UploadParams) error {
	return p.base.UploadObject(ctx, params)
}

func (p *Provider) RefreshCDN(context.Context, []string) error {
	return nil
}

func (p *Provider) ListDomains(context.Context, string) ([]string, error) {
	return []string{}, nil
}

const qiniuBucketListURL = "https://rs.qbox.me/buckets"

func qboxAccessToken(accessKey string, secretKey string, rawURL string) (string, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("parse qiniu url failed: %w", err)
	}

	signing := parsed.Path
	if parsed.RawQuery != "" {
		signing += "?" + parsed.RawQuery
	}
	signing += "\n"

	mac := hmac.New(sha1.New, []byte(secretKey))
	if _, err = mac.Write([]byte(signing)); err != nil {
		return "", fmt.Errorf("sign qiniu request failed: %w", err)
	}

	sign := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return accessKey + ":" + sign, nil
}

func parseQiniuBucketNames(body []byte) []string {
	names := make([]string, 0)

	var asArray []string
	if err := json.Unmarshal(body, &asArray); err == nil {
		for _, item := range asArray {
			name := strings.TrimSpace(item)
			if name != "" {
				names = append(names, name)
			}
		}
		if len(names) > 0 {
			return names
		}
	}

	for _, line := range strings.Split(string(body), "\n") {
		name := strings.TrimSpace(line)
		if name != "" {
			names = append(names, name)
		}
	}
	return names
}
