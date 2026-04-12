package s3compat

import (
	"context"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// Provider 是基于 minio-go 的 S3 兼容实现。
type Provider struct {
	provider string
	features []string
	account  model.Account
	client   *minio.Client
	options  Options
}

// EndpointResolver 按账户信息生成厂商默认 endpoint。
type EndpointResolver func(cfg model.Account) string

// Options 控制 S3 兼容客户端初始化策略。
type Options struct {
	RequireEndpoint  bool
	ResolveEndpoint  EndpointResolver
	ForcePathStyle   bool
	ForceVirtualHost bool
}

func New(provider string, features []string, options Options) *Provider {
	return &Provider{
		provider: provider,
		features: features,
		options:  options,
	}
}

func (p *Provider) Init(cfg model.Account) error {
	p.account = cfg

	endpoint := strings.TrimSpace(cfg.Endpoint)
	if endpoint == "" && p.options.ResolveEndpoint != nil {
		endpoint = strings.TrimSpace(p.options.ResolveEndpoint(cfg))
	}
	if endpoint == "" {
		if p.options.RequireEndpoint {
			return fmt.Errorf("endpoint is required for provider %s", p.provider)
		}
		return fmt.Errorf("endpoint resolve failed for provider %s", p.provider)
	}

	secure := true
	if strings.HasPrefix(endpoint, "http://") {
		secure = false
	}

	endpoint = strings.TrimPrefix(endpoint, "https://")
	endpoint = strings.TrimPrefix(endpoint, "http://")

	options := &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: secure,
		Region: cfg.Region,
	}
	if p.options.ForcePathStyle {
		options.BucketLookup = minio.BucketLookupPath
	} else if p.options.ForceVirtualHost {
		options.BucketLookup = minio.BucketLookupDNS
	}

	client, err := minio.New(endpoint, options)
	if err != nil {
		return fmt.Errorf("create minio client failed: %w", err)
	}

	p.client = client
	return nil
}

func (p *Provider) ListBuckets(ctx context.Context) ([]model.BucketInfo, error) {
	if p.client == nil {
		return nil, fmt.Errorf(
			"provider %s is not initialized", p.provider,
		)
	}

	buckets, err := p.client.ListBuckets(ctx)
	if err != nil {
		return nil, fmt.Errorf("list buckets failed: %w", err)
	}

	result := make([]model.BucketInfo, 0, len(buckets))
	for _, bucket := range buckets {
		// 尝试获取 bucket 的区域信息
		location, _ := p.client.GetBucketLocation(
			ctx, bucket.Name,
		)
		if location == "" {
			location = p.account.Region
		}
		result = append(result, model.BucketInfo{
			Name:     bucket.Name,
			Location: location,
			Provider: p.provider,
		})
	}
	return result, nil
}

func (p *Provider) ListObjects(ctx context.Context, params model.ListParams) (model.ListResult, error) {
	if p.client == nil {
		return model.ListResult{}, fmt.Errorf("provider %s is not initialized", p.provider)
	}
	if params.Limit <= 0 {
		params.Limit = 200
	}

	opt := minio.ListObjectsOptions{
		Prefix:     params.Prefix,
		Recursive:  params.Delimiter == "",
		MaxKeys:    params.Limit,
		StartAfter: params.Marker,
	}

	items := make([]model.ObjectItem, 0, params.Limit)
	truncated := false
	marker := ""
	for item := range p.client.ListObjects(ctx, params.Bucket, opt) {
		if item.Err != nil {
			return model.ListResult{}, fmt.Errorf("list objects failed: %w", item.Err)
		}
		if len(items) >= params.Limit {
			truncated = true
			break
		}
		lastMod := ""
		if !item.LastModified.IsZero() {
			lastMod = item.LastModified.Format(time.RFC3339)
		}
		items = append(items, model.ObjectItem{
			Key:          item.Key,
			Size:         item.Size,
			ETag:         item.ETag,
			LastModified: lastMod,
			IsDir:        strings.HasSuffix(item.Key, "/"),
		})
		marker = item.Key
	}

	return model.ListResult{
		Items:     items,
		Marker:    marker,
		Truncated: truncated,
	}, nil
}

// multipartPartSize 分片上传的分片大小（64MB）。
// minio-go 会在文件超过此大小时自动使用 multipart upload。
const multipartPartSize = 64 * 1024 * 1024

// multipartNumThreads 分片上传的并发线程数。
const multipartNumThreads = 4

// UploadObject 上传文件到 S3 兼容存储。
// 对于本地文件，通过 FPutObject 自动支持大文件分片上传；
// 对于远程 URL，通过 PutObject 流式上传。
func (p *Provider) UploadObject(
	ctx context.Context, params model.UploadParams,
) error {
	if p.client == nil {
		return fmt.Errorf(
			"provider %s is not initialized", p.provider,
		)
	}
	if params.Bucket == "" {
		return fmt.Errorf("bucket required")
	}
	key := strings.TrimSpace(params.Key)
	if key == "" && params.LocalPath != "" {
		key = filepath.Base(params.LocalPath)
	}
	if key == "" {
		return fmt.Errorf("object key required")
	}

	if params.LocalPath != "" {
		return p.uploadLocalFile(ctx, params, key)
	}
	if params.SourceURL != "" {
		return p.uploadFromURL(ctx, params, key)
	}
	return fmt.Errorf("localPath or sourceUrl required")
}

// uploadLocalFile 上传本地文件，自动对大文件启用分片上传。
func (p *Provider) uploadLocalFile(
	ctx context.Context, params model.UploadParams, key string,
) error {
	contentType := detectContentType(key, params.LocalPath)
	opts := minio.PutObjectOptions{
		ContentType: contentType,
		PartSize:    multipartPartSize,
		NumThreads:  multipartNumThreads,
	}

	// 如果调用方提供了进度回调，包装为 progress reader
	if params.ProgressFn != nil {
		info, err := os.Stat(params.LocalPath)
		if err == nil && info.Size() > 0 {
			opts.Progress = &progressReader{
				total:    info.Size(),
				callback: params.ProgressFn,
			}
		}
	}

	_, err := p.client.FPutObject(
		ctx, params.Bucket, key, params.LocalPath, opts,
	)
	if err != nil {
		return fmt.Errorf("upload local file failed: %w", err)
	}
	return nil
}

// uploadFromURL 从远程 URL 拉取并上传到存储。
func (p *Provider) uploadFromURL(
	ctx context.Context, params model.UploadParams, key string,
) error {
	req, err := http.NewRequestWithContext(
		ctx, http.MethodGet, params.SourceURL, nil,
	)
	if err != nil {
		return fmt.Errorf("build source url request failed: %w", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("fetch source url failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf(
			"fetch source url failed: status %d", resp.StatusCode,
		)
	}

	size := resp.ContentLength
	if size <= 0 {
		size = -1
	}
	opts := minio.PutObjectOptions{
		ContentType: resp.Header.Get("Content-Type"),
		PartSize:    multipartPartSize,
		NumThreads:  multipartNumThreads,
	}
	if params.ProgressFn != nil && size > 0 {
		opts.Progress = &progressReader{
			total:    size,
			callback: params.ProgressFn,
		}
	}

	_, err = p.client.PutObject(
		ctx, params.Bucket, key, resp.Body, size, opts,
	)
	if err != nil {
		return fmt.Errorf("upload source url failed: %w", err)
	}
	return nil
}

// progressReader 将 minio-go 的进度字节数转换为百分比回调。
// 实现 io.Reader 接口，用于 PutObjectOptions.Progress。
// minio-go 内部通过 Read 调用通知已传输的字节数。
type progressReader struct {
	total    int64
	read     int64
	lastPct  int
	callback func(percentage int)
}

func (pr *progressReader) Read(b []byte) (int, error) {
	n := len(b)
	pr.read += int64(n)
	pct := int(pr.read * 100 / pr.total)
	if pct > 99 {
		pct = 99
	}
	if pct > pr.lastPct {
		pr.lastPct = pct
		pr.callback(pct)
	}
	return n, nil
}

func (p *Provider) DownloadObject(ctx context.Context, params model.DownloadParams) error {
	if p.client == nil {
		return fmt.Errorf("provider %s is not initialized", p.provider)
	}
	if params.LocalPath == "" {
		return fmt.Errorf("localPath required")
	}
	if err := os.MkdirAll(filepath.Dir(params.LocalPath), 0o755); err != nil {
		return fmt.Errorf("prepare download directory failed: %w", err)
	}
	if err := p.client.FGetObject(ctx, params.Bucket, params.Key, params.LocalPath, minio.GetObjectOptions{}); err != nil {
		return fmt.Errorf("download object failed: %w", err)
	}
	return nil
}

func (p *Provider) DeleteObjects(ctx context.Context, bucket string, keys []string) error {
	if p.client == nil {
		return fmt.Errorf("provider %s is not initialized", p.provider)
	}
	if len(keys) == 0 {
		return nil
	}
	objectCh := make(chan minio.ObjectInfo, len(keys))
	for _, key := range keys {
		objectCh <- minio.ObjectInfo{Key: key}
	}
	close(objectCh)

	for removeErr := range p.client.RemoveObjects(ctx, bucket, objectCh, minio.RemoveObjectsOptions{}) {
		if removeErr.Err != nil {
			return fmt.Errorf("delete object %s failed: %w", removeErr.ObjectName, removeErr.Err)
		}
	}
	return nil
}

func (p *Provider) RenameObject(ctx context.Context, params model.RenameParams) error {
	if p.client == nil {
		return fmt.Errorf("provider %s is not initialized", p.provider)
	}
	_, err := p.client.CopyObject(
		ctx,
		minio.CopyDestOptions{Bucket: params.Bucket, Object: params.To},
		minio.CopySrcOptions{Bucket: params.Bucket, Object: params.From},
	)
	if err != nil {
		return fmt.Errorf("copy object failed: %w", err)
	}

	if err = p.client.RemoveObject(ctx, params.Bucket, params.From, minio.RemoveObjectOptions{}); err != nil {
		return fmt.Errorf("remove old object failed: %w", err)
	}
	return nil
}

func (p *Provider) GenerateURL(params model.SignedURLParams) (string, error) {
	if params.Domain != "" {
		scheme := "http"
		if params.HTTPS {
			scheme = "https"
		}
		return fmt.Sprintf("%s://%s/%s", scheme, params.Domain, params.Key), nil
	}

	if p.client == nil {
		return "", fmt.Errorf("provider %s is not initialized", p.provider)
	}

	expire := time.Duration(params.DeadlineSeconds) * time.Second
	if expire <= 0 {
		expire = time.Hour
	}
	link, err := p.client.PresignedGetObject(context.Background(), params.Bucket, params.Key, expire, url.Values{})
	if err != nil {
		return "", fmt.Errorf("generate presigned url failed: %w", err)
	}
	return link.String(), nil
}

// BucketLocation 返回 bucket 所在的区域。
func (p *Provider) BucketLocation(
	ctx context.Context,
	bucket string,
) (string, error) {
	if p.client == nil {
		return "", fmt.Errorf(
			"provider %s is not initialized", p.provider,
		)
	}
	return p.client.GetBucketLocation(ctx, bucket)
}

func (p *Provider) GetProviderFeatures() []string {
	return p.features
}

func detectContentType(key string, localPath string) string {
	ext := filepath.Ext(key)
	if ext == "" {
		ext = filepath.Ext(localPath)
	}
	if ext != "" {
		if guessed := mime.TypeByExtension(ext); guessed != "" {
			return guessed
		}
	}

	file, err := os.Open(localPath)
	if err != nil {
		return "application/octet-stream"
	}
	defer file.Close()

	header := make([]byte, 512)
	n, readErr := io.ReadFull(file, header)
	if readErr != nil && readErr != io.ErrUnexpectedEOF {
		return "application/octet-stream"
	}
	return http.DetectContentType(header[:n])
}
