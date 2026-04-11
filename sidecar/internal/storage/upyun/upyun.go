package upyun

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	upyunsdk "github.com/upyun/go-sdk/v3/upyun"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// Provider 又拍云适配器，基于又拍云官方 SDK 实现。
type Provider struct {
	account model.Account
	up      *upyunsdk.UpYun
}

func New() *Provider { return &Provider{} }

func (p *Provider) Init(cfg model.Account) error {
	if strings.TrimSpace(cfg.ServiceName) == "" {
		return fmt.Errorf(
			"serviceName is required for provider upyun",
		)
	}
	if strings.TrimSpace(cfg.AccessKey) == "" ||
		strings.TrimSpace(cfg.SecretKey) == "" {
		return fmt.Errorf(
			"accessKey/secretKey required for provider upyun",
		)
	}
	p.account = cfg
	p.up = upyunsdk.NewUpYun(&upyunsdk.UpYunConfig{
		Bucket:   cfg.ServiceName,
		Operator: cfg.AccessKey,
		Password: cfg.SecretKey,
	})
	return nil
}

// ListBuckets 又拍云无真正的 bucket 概念，返回服务名作为唯一 bucket。
func (p *Provider) ListBuckets(
	ctx context.Context,
) ([]model.BucketInfo, error) {
	// 通过获取 usage 验证凭证有效性
	usageURL := fmt.Sprintf(
		"https://v0.api.upyun.com/%s/?usage",
		url.PathEscape(p.account.ServiceName),
	)
	req, err := http.NewRequestWithContext(
		ctx, http.MethodGet, usageURL, nil,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"build upyun validation request failed: %w", err,
		)
	}
	req.SetBasicAuth(p.account.AccessKey, p.account.SecretKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf(
			"request upyun usage failed: %w", err,
		)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		msg := strings.TrimSpace(string(body))
		if msg == "" {
			msg = http.StatusText(resp.StatusCode)
		}
		return nil, fmt.Errorf(
			"validate upyun account failed: %s", msg,
		)
	}

	return []model.BucketInfo{
		{Name: p.account.ServiceName, Provider: "upyun"},
	}, nil
}

// ListObjects 列出又拍云指定路径下的文件和目录。
func (p *Provider) ListObjects(
	ctx context.Context,
	params model.ListParams,
) (model.ListResult, error) {
	if p.up == nil {
		return model.ListResult{}, fmt.Errorf(
			"upyun provider is not initialized",
		)
	}

	prefix := "/" + strings.TrimPrefix(params.Prefix, "/")
	if !strings.HasSuffix(prefix, "/") {
		prefix += "/"
	}

	limit := params.Limit
	if limit <= 0 {
		limit = 200
	}

	objsChan := make(chan *upyunsdk.FileInfo, limit)
	listConf := &upyunsdk.GetObjectsConfig{
		Path:         prefix,
		MaxListLevel: 1,
		ObjectsChan:  objsChan,
	}

	// 在后台执行列表请求
	errCh := make(chan error, 1)
	go func() {
		errCh <- p.up.List(listConf)
	}()

	items := make([]model.ObjectItem, 0, limit)
	truncated := false
	marker := ""
	for info := range objsChan {
		if len(items) >= limit {
			truncated = true
			continue // 排空 channel
		}
		key := strings.TrimPrefix(prefix, "/") + info.Name
		isDir := info.IsDir
		if isDir {
			key += "/"
		}
		items = append(items, model.ObjectItem{
			Key:  key,
			Size: info.Size,
			LastModified: time.Unix(
				info.Time.Unix(), 0,
			).Format(time.RFC3339),
			IsDir: isDir,
		})
		marker = key
	}

	if err := <-errCh; err != nil {
		return model.ListResult{}, fmt.Errorf(
			"upyun list objects failed: %w", err,
		)
	}

	return model.ListResult{
		Items:     items,
		Marker:    marker,
		Truncated: truncated,
	}, nil
}

// UploadObject 上传文件到又拍云。
func (p *Provider) UploadObject(
	ctx context.Context,
	params model.UploadParams,
) error {
	if p.up == nil {
		return fmt.Errorf("upyun provider is not initialized")
	}

	key := "/" + strings.TrimPrefix(params.Key, "/")

	// 从本地文件上传
	if params.LocalPath != "" {
		f, err := os.Open(params.LocalPath)
		if err != nil {
			return fmt.Errorf(
				"open local file failed: %w", err,
			)
		}
		defer f.Close()

		return p.up.Put(&upyunsdk.PutObjectConfig{
			Path:   key,
			Reader: f,
		})
	}

	// 从远程 URL 抓取上传
	if params.SourceURL != "" {
		req, err := http.NewRequestWithContext(
			ctx, http.MethodGet, params.SourceURL, nil,
		)
		if err != nil {
			return fmt.Errorf(
				"build source url request failed: %w", err,
			)
		}
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return fmt.Errorf(
				"fetch source url failed: %w", err,
			)
		}
		defer resp.Body.Close()
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return fmt.Errorf(
				"fetch source url failed: status %d",
				resp.StatusCode,
			)
		}

		return p.up.Put(&upyunsdk.PutObjectConfig{
			Path:   key,
			Reader: resp.Body,
		})
	}

	// 空内容上传（用于创建文件夹等场景）
	return p.up.Put(&upyunsdk.PutObjectConfig{
		Path:   key,
		Reader: strings.NewReader(""),
	})
}

// DownloadObject 从又拍云下载文件到本地。
func (p *Provider) DownloadObject(
	_ context.Context,
	params model.DownloadParams,
) error {
	if p.up == nil {
		return fmt.Errorf("upyun provider is not initialized")
	}
	if params.LocalPath == "" {
		return fmt.Errorf("localPath required")
	}
	if err := os.MkdirAll(
		filepath.Dir(params.LocalPath), 0o755,
	); err != nil {
		return fmt.Errorf(
			"prepare download directory failed: %w", err,
		)
	}

	f, err := os.Create(params.LocalPath)
	if err != nil {
		return fmt.Errorf("create local file failed: %w", err)
	}
	defer f.Close()

	key := "/" + strings.TrimPrefix(params.Key, "/")
	_, err = p.up.Get(&upyunsdk.GetObjectConfig{
		Path:   key,
		Writer: f,
	})
	if err != nil {
		return fmt.Errorf("upyun download failed: %w", err)
	}
	return nil
}

// DeleteObjects 删除又拍云上的一个或多个文件。
func (p *Provider) DeleteObjects(
	_ context.Context,
	_ string,
	keys []string,
) error {
	if p.up == nil {
		return fmt.Errorf("upyun provider is not initialized")
	}
	for _, k := range keys {
		key := "/" + strings.TrimPrefix(k, "/")
		if err := p.up.Delete(&upyunsdk.DeleteObjectConfig{
			Path: key,
		}); err != nil {
			return fmt.Errorf(
				"upyun delete %s failed: %w", k, err,
			)
		}
	}
	return nil
}

// RenameObject 重命名又拍云上的文件（通过 move 实现）。
func (p *Provider) RenameObject(
	_ context.Context,
	params model.RenameParams,
) error {
	if p.up == nil {
		return fmt.Errorf("upyun provider is not initialized")
	}
	src := "/" + strings.TrimPrefix(params.From, "/")
	dst := "/" + strings.TrimPrefix(params.To, "/")

	// 又拍云 SDK 支持 move 操作
	return p.up.Move(&upyunsdk.MoveObjectConfig{
		SrcPath:  src,
		DestPath: dst,
	})
}

// GenerateURL 生成又拍云文件的访问 URL（需要自定义域名）。
func (p *Provider) GenerateURL(
	params model.SignedURLParams,
) (string, error) {
	if params.Domain == "" {
		return "", fmt.Errorf("domain required for upyun")
	}
	return fmt.Sprintf(
		"https://%s/%s", params.Domain, params.Key,
	), nil
}

func (p *Provider) GetProviderFeatures() []string {
	return []string{"refreshCDN", "customDomain"}
}

// FetchURL 又拍云暂不支持URL抓取，使用下载+上传模拟。
func (p *Provider) FetchURL(
	ctx context.Context,
	params model.UploadParams,
) error {
	return p.UploadObject(ctx, params)
}

// RefreshCDN 使用又拍云 SDK Purge 方法刷新 CDN 缓存。
func (p *Provider) RefreshCDN(_ context.Context, urls []string) error {
	return p.refreshCDNImpl(urls)
}

func (p *Provider) refreshCDNImpl(urls []string) error {
	if len(urls) == 0 {
		return nil
	}
	if p.up == nil {
		return fmt.Errorf("upyun client not initialized")
	}
	fails, err := p.up.Purge(urls)
	if err != nil {
		return fmt.Errorf("upyun purge failed: %w", err)
	}
	if len(fails) > 0 {
		return fmt.Errorf("upyun purge partially failed: %v", fails)
	}
	return nil
}

// refreshCDNWithURL 用于测试的 HTTP 直调版本。
func (p *Provider) refreshCDNWithURL(ctx context.Context, apiURL string, urls []string) error {
	if len(urls) == 0 {
		return nil
	}

	purgeList := strings.Join(urls, "\n")
	form := url.Values{"purge": {purgeList}}

	req, err := http.NewRequestWithContext(
		ctx, http.MethodPost, apiURL, strings.NewReader(form.Encode()),
	)
	if err != nil {
		return fmt.Errorf("build upyun purge request failed: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("upyun purge request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("upyun purge failed(%d): %s", resp.StatusCode, string(body))
	}
	return nil
}

// PrefetchCDN 又拍云不支持 CDN 预热。
func (p *Provider) PrefetchCDN(_ context.Context, _ []string) error {
	return model.ErrNotSupported
}

// ListDomains 又拍云不支持域名列表 API，返回空列表。
func (p *Provider) ListDomains(_ context.Context, _ string) ([]string, error) {
	return []string{}, nil
}

// GetRefreshQuota 又拍云不支持配额查询。
func (p *Provider) GetRefreshQuota(_ context.Context) (*model.CDNQuota, error) {
	return nil, model.ErrNotSupported
}

