package ali

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
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

const aliCDNEndpoint = "https://cdn.aliyuncs.com"

// percentEncode 按阿里云签名规范对字符串进行百分号编码。
// 空格编码为 %20，星号编码为 %2A，波浪线保持原样。
func percentEncode(s string) string {
	encoded := url.QueryEscape(s)
	encoded = strings.ReplaceAll(encoded, "+", "%20")
	encoded = strings.ReplaceAll(encoded, "*", "%2A")
	encoded = strings.ReplaceAll(encoded, "%7E", "~")
	return encoded
}

// signRequest 使用阿里云签名 V1 计算请求签名并返回完整 URL。
func signRequest(
	accessKey, secretKey string, params map[string]string,
) string {
	// 按 key 字典序排列
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// 构建 canonicalized query string
	pairs := make([]string, 0, len(keys))
	for _, k := range keys {
		pairs = append(pairs,
			percentEncode(k)+"="+percentEncode(params[k]),
		)
	}
	canonicalized := strings.Join(pairs, "&")

	// StringToSign = GET&%2F&<percentEncode(canonicalized)>
	stringToSign := "GET&" + percentEncode("/") +
		"&" + percentEncode(canonicalized)

	// HMAC-SHA1 签名
	mac := hmac.New(sha1.New, []byte(secretKey+"&"))
	mac.Write([]byte(stringToSign))
	signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	// 构造最终 query string
	vals := url.Values{}
	for k, v := range params {
		vals.Set(k, v)
	}
	vals.Set("Signature", signature)
	return vals.Encode()
}

// buildCommonParams 构建阿里云 CDN API 公共请求参数。
func buildCommonParams(accessKey, action string) map[string]string {
	return map[string]string{
		"Format":           "JSON",
		"Version":          "2018-05-10",
		"AccessKeyId":      accessKey,
		"SignatureMethod":  "HMAC-SHA1",
		"Timestamp":        time.Now().UTC().Format("2006-01-02T15:04:05Z"),
		"SignatureVersion": "1.0",
		"SignatureNonce":   uuid.New().String(),
		"Action":           action,
	}
}

// cdnRequest 发送阿里云 CDN API 请求并返回响应体。
func (p *Provider) cdnRequest(
	ctx context.Context, endpoint string, params map[string]string,
) ([]byte, error) {
	qs := signRequest(
		p.account.AccessKey, p.account.SecretKey, params,
	)
	reqURL := endpoint + "?" + qs

	req, err := http.NewRequestWithContext(
		ctx, http.MethodGet, reqURL, nil,
	)
	if err != nil {
		return nil, fmt.Errorf("build ali cdn request failed: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ali cdn request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read ali cdn response failed: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf(
			"ali cdn failed(%d): %s",
			resp.StatusCode, string(body),
		)
	}
	return body, nil
}

// RefreshCDN 使用阿里云 CDN API 刷新指定 URL 缓存。
func (p *Provider) RefreshCDN(
	ctx context.Context, urls []string,
) error {
	return p.refreshCDNWithEndpoint(ctx, aliCDNEndpoint, urls)
}

func (p *Provider) refreshCDNWithEndpoint(
	ctx context.Context, endpoint string, urls []string,
) error {
	if len(urls) == 0 {
		return nil
	}
	params := buildCommonParams(p.account.AccessKey, "RefreshObjectCaches")
	params["ObjectPath"] = strings.Join(urls, "\n")
	params["ObjectType"] = "File"

	_, err := p.cdnRequest(ctx, endpoint, params)
	return err
}

// PrefetchCDN 使用阿里云 CDN API 预热指定 URL。
func (p *Provider) PrefetchCDN(
	ctx context.Context, urls []string,
) error {
	return p.prefetchCDNWithEndpoint(ctx, aliCDNEndpoint, urls)
}

func (p *Provider) prefetchCDNWithEndpoint(
	ctx context.Context, endpoint string, urls []string,
) error {
	if len(urls) == 0 {
		return nil
	}
	params := buildCommonParams(p.account.AccessKey, "PushObjectCache")
	params["ObjectPath"] = strings.Join(urls, "\n")

	_, err := p.cdnRequest(ctx, endpoint, params)
	return err
}

// GetRefreshQuota 查询阿里云 CDN 刷新/预热每日配额。
func (p *Provider) GetRefreshQuota(
	ctx context.Context,
) (*model.CDNQuota, error) {
	return p.getRefreshQuotaWithEndpoint(ctx, aliCDNEndpoint)
}

func (p *Provider) getRefreshQuotaWithEndpoint(
	ctx context.Context, endpoint string,
) (*model.CDNQuota, error) {
	params := buildCommonParams(
		p.account.AccessKey, "DescribeRefreshQuota",
	)

	body, err := p.cdnRequest(ctx, endpoint, params)
	if err != nil {
		return nil, err
	}

	// 阿里云 quota 响应字段为字符串类型
	var raw struct {
		UrlRemain     string `json:"UrlRemain"`
		UrlQuota      string `json:"UrlQuota"`
		DirRemain     string `json:"DirRemain"`
		DirQuota      string `json:"DirQuota"`
		PreloadRemain string `json:"PreloadRemain"`
		PreloadQuota  string `json:"PreloadQuota"`
	}
	if err = json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("parse ali cdn quota failed: %w", err)
	}

	urlRemain, _ := strconv.Atoi(raw.UrlRemain)
	urlQuota, _ := strconv.Atoi(raw.UrlQuota)
	dirRemain, _ := strconv.Atoi(raw.DirRemain)
	dirQuota, _ := strconv.Atoi(raw.DirQuota)
	prefetchRemain, _ := strconv.Atoi(raw.PreloadRemain)
	prefetchQuota, _ := strconv.Atoi(raw.PreloadQuota)

	return &model.CDNQuota{
		URLRefreshRemain: urlRemain,
		URLRefreshLimit:  urlQuota,
		DirRefreshRemain: dirRemain,
		DirRefreshLimit:  dirQuota,
		PrefetchRemain:   prefetchRemain,
		PrefetchLimit:    prefetchQuota,
	}, nil
}

// ListDomains 查询阿里云 CDN 加速域名列表。
func (p *Provider) ListDomains(
	ctx context.Context, _ string,
) ([]string, error) {
	return p.listDomainsWithEndpoint(ctx, aliCDNEndpoint)
}

func (p *Provider) listDomainsWithEndpoint(
	ctx context.Context, endpoint string,
) ([]string, error) {
	params := buildCommonParams(
		p.account.AccessKey, "DescribeUserDomains",
	)
	params["PageSize"] = "50"

	body, err := p.cdnRequest(ctx, endpoint, params)
	if err != nil {
		return nil, err
	}

	var raw struct {
		Domains struct {
			PageData []struct {
				DomainName string `json:"DomainName"`
			} `json:"PageData"`
		} `json:"Domains"`
	}
	if err = json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf(
			"parse ali cdn domains failed: %w", err,
		)
	}

	domains := make([]string, 0, len(raw.Domains.PageData))
	for _, d := range raw.Domains.PageData {
		if d.DomainName != "" {
			domains = append(domains, d.DomainName)
		}
	}
	return domains, nil
}
