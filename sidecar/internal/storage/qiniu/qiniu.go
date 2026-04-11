package qiniu

import (
	"bytes"
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
			[]string{
				"urlUpload", "refreshCDN", "prefetchCDN",
				"cdnQuota", "customDomain", "paging",
				"lifecycle", "cors",
			},
			s3compat.Options{
				ResolveEndpoint: func(cfg model.Account) string {
					region := strings.TrimSpace(cfg.Region)
					if region == "" {
						region = "cn-east-1"
					}
					return fmt.Sprintf(
						"s3-%s.qiniucs.com", region,
					)
				},
			},
		),
	}
}

func (p *Provider) Init(cfg model.Account) error {
	p.account = cfg
	return p.base.Init(cfg)
}

func (p *Provider) ListBuckets(
	ctx context.Context,
) ([]model.BucketInfo, error) {
	token, err := qboxAccessToken(
		p.account.AccessKey,
		p.account.SecretKey,
		qiniuBucketListURL,
	)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(
		ctx, http.MethodGet, qiniuBucketListURL, nil,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"build qiniu bucket request failed: %w", err,
		)
	}
	req.Header.Set("Authorization", "QBox "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf(
			"request qiniu buckets failed: %w", err,
		)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf(
			"read qiniu buckets response failed: %w", err,
		)
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

func (p *Provider) ListObjects(
	ctx context.Context, params model.ListParams,
) (model.ListResult, error) {
	return p.base.ListObjects(ctx, params)
}

func (p *Provider) UploadObject(
	ctx context.Context, params model.UploadParams,
) error {
	return p.base.UploadObject(ctx, params)
}

func (p *Provider) DownloadObject(
	ctx context.Context, params model.DownloadParams,
) error {
	return p.base.DownloadObject(ctx, params)
}

func (p *Provider) DeleteObjects(
	ctx context.Context, bucket string, keys []string,
) error {
	return p.base.DeleteObjects(ctx, bucket, keys)
}

func (p *Provider) RenameObject(
	ctx context.Context, params model.RenameParams,
) error {
	return p.base.RenameObject(ctx, params)
}

func (p *Provider) GenerateURL(
	params model.SignedURLParams,
) (string, error) {
	return p.base.GenerateURL(params)
}

func (p *Provider) GetProviderFeatures() []string {
	return p.base.GetProviderFeatures()
}

// FetchURL 使用七牛 fetch API 从远程 URL 抓取资源到存储空间。
// API: POST /fetch/{EncodedURL}/to/{EncodedEntryURI}
func (p *Provider) FetchURL(
	ctx context.Context, params model.UploadParams,
) error {
	if params.SourceURL == "" {
		return fmt.Errorf("sourceUrl required for fetch")
	}

	encodedURL := base64.RawURLEncoding.EncodeToString(
		[]byte(params.SourceURL),
	)
	entryURI := params.Bucket + ":" + params.Key
	encodedEntry := base64.RawURLEncoding.EncodeToString(
		[]byte(entryURI),
	)

	fetchURL := fmt.Sprintf(
		"%s/fetch/%s/to/%s",
		qiniuFetchHost, encodedURL, encodedEntry,
	)

	token, err := qboxAccessToken(
		p.account.AccessKey, p.account.SecretKey, fetchURL,
	)
	if err != nil {
		return fmt.Errorf("sign qiniu fetch failed: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx, http.MethodPost, fetchURL, nil,
	)
	if err != nil {
		return fmt.Errorf(
			"build qiniu fetch request failed: %w", err,
		)
	}
	req.Header.Set("Authorization", "QBox "+token)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("qiniu fetch request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf(
			"qiniu fetch failed(%d): %s",
			resp.StatusCode, string(body),
		)
	}
	return nil
}

// cdnRefreshRequest CDN 刷新请求体。
type cdnRefreshRequest struct {
	URLs []string `json:"urls"`
}

// RefreshCDN 使用七牛 CDN 刷新 API 刷新指定 URL 缓存。
func (p *Provider) RefreshCDN(ctx context.Context, urls []string) error {
	return p.refreshCDNWithURL(ctx, qiniuCDNRefreshURL, urls)
}

func (p *Provider) refreshCDNWithURL(ctx context.Context, apiURL string, urls []string) error {
	if len(urls) == 0 {
		return nil
	}
	return p.postCDNAction(ctx, apiURL, cdnRefreshRequest{URLs: urls})
}

// PrefetchCDN 使用七牛 CDN 预热 API 预热指定 URL。
func (p *Provider) PrefetchCDN(ctx context.Context, urls []string) error {
	return p.prefetchCDNWithURL(ctx, qiniuCDNPrefetchURL, urls)
}

func (p *Provider) prefetchCDNWithURL(ctx context.Context, apiURL string, urls []string) error {
	if len(urls) == 0 {
		return nil
	}
	return p.postCDNAction(ctx, apiURL, struct {
		URLs []string `json:"urls"`
	}{URLs: urls})
}

// GetRefreshQuota 查询七牛 CDN 刷新/预热每日配额。
func (p *Provider) GetRefreshQuota(ctx context.Context) (*model.CDNQuota, error) {
	return p.getRefreshQuotaWithURL(ctx, qiniuCDNQuotaURL)
}

func (p *Provider) getRefreshQuotaWithURL(
	ctx context.Context, apiURL string,
) (*model.CDNQuota, error) {
	token, err := qboxAccessToken(p.account.AccessKey, p.account.SecretKey, apiURL)
	if err != nil {
		return nil, fmt.Errorf("sign qiniu quota failed: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build quota request failed: %w", err)
	}
	req.Header.Set("Authorization", "QBox "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("quota request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read quota response failed: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("quota failed(%d): %s", resp.StatusCode, string(body))
	}

	var raw struct {
		URLSurplus      int `json:"urlSurplusDay"`
		URLQuota        int `json:"urlQuotaDay"`
		DirSurplus      int `json:"dirSurplusDay"`
		DirQuota        int `json:"dirQuotaDay"`
		PrefetchSurplus int `json:"prefetchSurplusDay"`
		PrefetchQuota   int `json:"prefetchQuotaDay"`
	}
	if err = json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("parse quota failed: %w", err)
	}
	return &model.CDNQuota{
		URLRefreshRemain: raw.URLSurplus,
		URLRefreshLimit:  raw.URLQuota,
		DirRefreshRemain: raw.DirSurplus,
		DirRefreshLimit:  raw.DirQuota,
		PrefetchRemain:   raw.PrefetchSurplus,
		PrefetchLimit:    raw.PrefetchQuota,
	}, nil
}

// postCDNAction 发送 CDN 管理类 POST 请求（带请求体签名）。
func (p *Provider) postCDNAction(ctx context.Context, apiURL string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal cdn body failed: %w", err)
	}

	token, err := qboxAccessTokenWithBody(
		p.account.AccessKey, p.account.SecretKey, apiURL, body,
	)
	if err != nil {
		return fmt.Errorf("sign cdn request failed: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build cdn request failed: %w", err)
	}
	req.Header.Set("Authorization", "QBox "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("cdn request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("cdn action failed(%d): %s", resp.StatusCode, string(respBody))
	}
	return nil
}

// ListDomains 获取七牛存储空间绑定的域名列表。
// API: GET /v6/domain/list?tbl={bucket} (api.qiniu.com)
func (p *Provider) ListDomains(
	ctx context.Context, bucket string,
) ([]string, error) {
	domainURL := fmt.Sprintf(
		"%s/v6/domain/list?tbl=%s",
		qiniuAPIHost, url.QueryEscape(bucket),
	)

	token, err := qboxAccessToken(
		p.account.AccessKey, p.account.SecretKey, domainURL,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"sign qiniu domains failed: %w", err,
		)
	}

	req, err := http.NewRequestWithContext(
		ctx, http.MethodGet, domainURL, nil,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"build qiniu domains request failed: %w", err,
		)
	}
	req.Header.Set("Authorization", "QBox "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf(
			"qiniu domains request failed: %w", err,
		)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf(
			"read qiniu domains response failed: %w", err,
		)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf(
			"qiniu domains failed(%d): %s",
			resp.StatusCode, string(respBody),
		)
	}

	var domains []string
	if err = json.Unmarshal(respBody, &domains); err != nil {
		return nil, fmt.Errorf(
			"parse qiniu domains failed: %w", err,
		)
	}
	return domains, nil
}

const (
	qiniuBucketListURL  = "https://rs.qbox.me/buckets"
	qiniuFetchHost      = "https://ioapi.qiniuapi.com"
	qiniuCDNRefreshURL  = "https://fusion.qiniuapi.com/v2/tune/refresh"
	qiniuCDNPrefetchURL = "https://fusion.qiniuapi.com/v2/tune/prefetch"
	qiniuCDNQuotaURL    = "https://fusion.qiniuapi.com/v2/tune/refresh/quota"
	qiniuAPIHost        = "https://api.qiniu.com"
)

// qboxAccessToken 生成七牛 QBox 管理凭证（不含请求体）。
func qboxAccessToken(
	accessKey, secretKey, rawURL string,
) (string, error) {
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

// qboxAccessTokenWithBody 生成七牛 QBox 管理凭证（包含请求体）。
func qboxAccessTokenWithBody(
	accessKey, secretKey, rawURL string,
	body []byte,
) (string, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("parse qiniu url failed: %w", err)
	}

	signing := parsed.Path
	if parsed.RawQuery != "" {
		signing += "?" + parsed.RawQuery
	}
	signing += "\n"
	signing += string(body)

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
