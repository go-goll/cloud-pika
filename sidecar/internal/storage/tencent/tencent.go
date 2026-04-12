package tencent

import (
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/hex"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/goll/cloud-pika/sidecar/internal/model"
	"github.com/goll/cloud-pika/sidecar/internal/storage/s3compat"
)

// Provider 腾讯云 COS 适配器。
// 腾讯云的 service.cos.myqcloud.com 仅支持 ListBuckets，
// 操作具体 bucket 必须使用 cos.{region}.myqcloud.com。
type Provider struct {
	account model.Account
	mu      sync.Mutex
	// bucketRegions 缓存 bucket→region 映射
	bucketRegions map[string]string
	// regionClients 按 region 缓存的 s3compat 客户端
	regionClients map[string]*s3compat.Provider
}

func New() *Provider {
	return &Provider{
		bucketRegions: make(map[string]string),
		regionClients: make(map[string]*s3compat.Provider),
	}
}

func (p *Provider) Init(cfg model.Account) error {
	p.account = cfg
	return nil
}

// ──────────── ListBuckets ────────────

// cosListBucketsResult COS ListBuckets XML 响应结构。
type cosListBucketsResult struct {
	XMLName xml.Name `xml:"ListAllMyBucketsResult"`
	Buckets struct {
		Bucket []cosBucketEntry `xml:"Bucket"`
	} `xml:"Buckets"`
}

type cosBucketEntry struct {
	Name         string `xml:"Name"`
	Location     string `xml:"Location"`
	CreationDate string `xml:"CreationDate"`
}

// ListBuckets 直接请求 COS service 端点，
// 解析完整XML获取每个 bucket 的 region。
func (p *Provider) ListBuckets(
	ctx context.Context,
) ([]model.BucketInfo, error) {
	body, err := p.cosServiceRequest(ctx)
	if err != nil {
		return nil, fmt.Errorf("list buckets failed: %w", err)
	}
	defer body.Close()

	data, err := io.ReadAll(body)
	if err != nil {
		return nil, fmt.Errorf("read response failed: %w", err)
	}

	var result cosListBucketsResult
	if err = xml.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf(
			"parse buckets XML failed: %w", err,
		)
	}

	buckets := make(
		[]model.BucketInfo, 0, len(result.Buckets.Bucket),
	)
	for _, b := range result.Buckets.Bucket {
		// 缓存 bucket→region 映射
		if b.Location != "" {
			p.mu.Lock()
			p.bucketRegions[b.Name] = b.Location
			p.mu.Unlock()
		}
		buckets = append(buckets, model.BucketInfo{
			Name:     b.Name,
			Location: b.Location,
			Provider: "tencent",
		})
	}
	return buckets, nil
}

// cosServiceRequest 向 service.cos.myqcloud.com 发送
// 带签名的 GET 请求。
func (p *Provider) cosServiceRequest(
	ctx context.Context,
) (io.ReadCloser, error) {
	const host = "service.cos.myqcloud.com"
	reqURL := "https://" + host + "/"
	req, err := http.NewRequestWithContext(
		ctx, http.MethodGet, reqURL, nil,
	)
	if err != nil {
		return nil, err
	}

	// COS 签名 v5
	now := time.Now()
	signTime := fmt.Sprintf(
		"%d;%d", now.Unix(), now.Add(time.Hour).Unix(),
	)
	httpString := fmt.Sprintf(
		"get\n/\n\nhost=%s\n", host,
	)
	stringToSign := fmt.Sprintf(
		"sha1\n%s\n%s\n",
		signTime,
		sha1Hex(httpString),
	)
	signKey := hmacSHA1(p.account.SecretKey, signTime)
	signature := hmacSHA1(signKey, stringToSign)

	auth := fmt.Sprintf(
		"q-sign-algorithm=sha1"+
			"&q-ak=%s"+
			"&q-sign-time=%s"+
			"&q-key-time=%s"+
			"&q-header-list=host"+
			"&q-url-param-list="+
			"&q-signature=%s",
		p.account.AccessKey, signTime, signTime, signature,
	)

	req.Header.Set("Host", host)
	req.Header.Set("Authorization", auth)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		defer resp.Body.Close()
		errBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf(
			"COS service request failed (%d): %s",
			resp.StatusCode, string(errBody),
		)
	}
	return resp.Body, nil
}

// ──────────── Region Client ────────────

// regionClient 获取或创建指定 region 的 s3compat 客户端。
func (p *Provider) regionClient(
	region string,
) (*s3compat.Provider, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if client, ok := p.regionClients[region]; ok {
		return client, nil
	}

	cfg := p.account
	cfg.Region = region
	cfg.Endpoint = fmt.Sprintf(
		"cos.%s.myqcloud.com", region,
	)

	client := s3compat.New(
		"tencent",
		[]string{"paging", "lifecycle", "cors", "encryption", "versioning"},
		s3compat.Options{ForceVirtualHost: true},
	)
	if err := client.Init(cfg); err != nil {
		return nil, fmt.Errorf(
			"init region client (%s): %w", region, err,
		)
	}

	p.regionClients[region] = client
	return client, nil
}

// bucketClient 根据 bucket 名称获取对应 region 的客户端。
func (p *Provider) bucketClient(
	ctx context.Context,
	bucket string,
) (*s3compat.Provider, error) {
	// 优先使用账户配置的 region
	if p.account.Region != "" {
		return p.regionClient(p.account.Region)
	}

	// 从缓存中获取 bucket region
	p.mu.Lock()
	region, ok := p.bucketRegions[bucket]
	p.mu.Unlock()

	if !ok || region == "" {
		// 缓存未命中，重新请求 ListBuckets 刷新缓存
		if _, err := p.ListBuckets(ctx); err != nil {
			return nil, fmt.Errorf(
				"refresh bucket regions: %w", err,
			)
		}
		p.mu.Lock()
		region = p.bucketRegions[bucket]
		p.mu.Unlock()
	}

	if region == "" {
		return nil, fmt.Errorf(
			"cannot determine region for bucket %s", bucket,
		)
	}

	return p.regionClient(region)
}

// ──────────── 对象操作（委托给 regionClient）────────────

func (p *Provider) ListObjects(
	ctx context.Context,
	params model.ListParams,
) (model.ListResult, error) {
	c, err := p.bucketClient(ctx, params.Bucket)
	if err != nil {
		return model.ListResult{}, err
	}
	return c.ListObjects(ctx, params)
}

func (p *Provider) UploadObject(
	ctx context.Context,
	params model.UploadParams,
) error {
	c, err := p.bucketClient(ctx, params.Bucket)
	if err != nil {
		return err
	}
	return c.UploadObject(ctx, params)
}

func (p *Provider) DownloadObject(
	ctx context.Context,
	params model.DownloadParams,
) error {
	c, err := p.bucketClient(ctx, params.Bucket)
	if err != nil {
		return err
	}
	return c.DownloadObject(ctx, params)
}

func (p *Provider) DeleteObjects(
	ctx context.Context,
	bucket string,
	keys []string,
) error {
	c, err := p.bucketClient(ctx, bucket)
	if err != nil {
		return err
	}
	return c.DeleteObjects(ctx, bucket, keys)
}

func (p *Provider) RenameObject(
	ctx context.Context,
	params model.RenameParams,
) error {
	c, err := p.bucketClient(ctx, params.Bucket)
	if err != nil {
		return err
	}
	return c.RenameObject(ctx, params)
}

func (p *Provider) GenerateURL(
	params model.SignedURLParams,
) (string, error) {
	// GenerateURL 也需要 region-specific 客户端
	region := p.account.Region
	if region == "" {
		p.mu.Lock()
		region = p.bucketRegions[params.Bucket]
		p.mu.Unlock()
	}
	if region == "" {
		// 缓存未命中，刷新 bucket→region 映射
		if _, err := p.ListBuckets(
			context.Background(),
		); err != nil {
			return "", fmt.Errorf(
				"refresh bucket regions: %w", err,
			)
		}
		p.mu.Lock()
		region = p.bucketRegions[params.Bucket]
		p.mu.Unlock()
	}
	if region == "" {
		return "", fmt.Errorf(
			"cannot determine region for bucket %s",
			params.Bucket,
		)
	}
	c, err := p.regionClient(region)
	if err != nil {
		return "", err
	}
	return c.GenerateURL(params)
}

func (p *Provider) GetProviderFeatures() []string {
	return []string{
		"paging", "lifecycle", "cors",
		"encryption", "versioning",
		"refreshCDN", "prefetchCDN", "cdnQuota", "customDomain",
	}
}

// ──────────── 签名工具函数 ────────────

func sha1Hex(s string) string {
	h := sha1.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}

func hmacSHA1(key, data string) string {
	h := hmac.New(sha1.New, []byte(key))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}
