package aws

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/goll/cloud-pika/sidecar/internal/model"
)

const (
	cfEndpoint = "https://cloudfront.amazonaws.com"
	cfRegion   = "us-east-1"
	cfService  = "cloudfront"
	cfAPIVer   = "2020-05-31"
)

// invalidationBatch 是 CreateInvalidation 请求体。
type invalidationBatch struct {
	XMLName        xml.Name         `xml:"InvalidationBatch"`
	XMLNS          string           `xml:"xmlns,attr"`
	Paths          invalidationPath `xml:"Paths"`
	CallerRef      string           `xml:"CallerReference"`
}

type invalidationPath struct {
	Quantity int      `xml:"Quantity"`
	Items    []string `xml:"Items>Path"`
}

// distributionList 是 ListDistributions 响应的 XML 结构。
type distributionList struct {
	XMLName xml.Name              `xml:"DistributionList"`
	Items   []distributionSummary `xml:"Items>DistributionSummary"`
}

type distributionSummary struct {
	ID         string              `xml:"Id"`
	DomainName string              `xml:"DomainName"`
	Aliases    distributionAliases `xml:"Aliases"`
}

type distributionAliases struct {
	Items []string `xml:"Items>CNAME"`
}

// RefreshCDN 通过 CloudFront CreateInvalidation 刷新缓存。
// 先 ListDistributions 找到 URL 域名对应的分发，再提交失效请求。
func (p *Provider) RefreshCDN(
	ctx context.Context, urls []string,
) error {
	if len(urls) == 0 {
		return nil
	}

	// 按域名对 URL 分组
	grouped := groupURLsByHost(urls)
	if len(grouped) == 0 {
		return fmt.Errorf("no valid URLs provided")
	}

	// 获取所有 CloudFront 分发
	dists, err := p.listDistributions(ctx)
	if err != nil {
		return fmt.Errorf("list CloudFront distributions: %w", err)
	}

	// 将域名匹配到分发，收集 distID -> paths
	distPaths := make(map[string][]string)
	for host, paths := range grouped {
		distID := matchDistribution(dists, host)
		if distID == "" {
			return fmt.Errorf(
				"no CloudFront distribution found for domain %q", host,
			)
		}
		distPaths[distID] = append(distPaths[distID], paths...)
	}

	// 对每个分发创建 invalidation
	for distID, paths := range distPaths {
		if err := p.createInvalidation(ctx, distID, paths); err != nil {
			return fmt.Errorf(
				"create invalidation for %s: %w", distID, err,
			)
		}
	}
	return nil
}

// PrefetchCDN CloudFront 不支持预热。
func (p *Provider) PrefetchCDN(
	_ context.Context, _ []string,
) error {
	return model.ErrNotSupported
}

// ListDomains CloudFront 域名管理模型不同，不支持。
func (p *Provider) ListDomains(
	_ context.Context, _ string,
) ([]string, error) {
	return nil, model.ErrNotSupported
}

// GetRefreshQuota CloudFront 无配额查询 API。
func (p *Provider) GetRefreshQuota(
	_ context.Context,
) (*model.CDNQuota, error) {
	return nil, model.ErrNotSupported
}

// listDistributions 调用 CloudFront ListDistributions API。
func (p *Provider) listDistributions(
	ctx context.Context,
) ([]distributionSummary, error) {
	uri := "/" + cfAPIVer + "/distribution"
	resp, err := p.signedRequest(ctx, http.MethodGet, uri, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf(
			"ListDistributions failed(%d): %s",
			resp.StatusCode, string(body),
		)
	}

	var list distributionList
	if err := xml.Unmarshal(body, &list); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}
	return list.Items, nil
}

// createInvalidation 调用 CloudFront CreateInvalidation API。
func (p *Provider) createInvalidation(
	ctx context.Context, distID string, paths []string,
) error {
	batch := invalidationBatch{
		XMLNS:     "http://cloudfront.amazonaws.com/doc/" + cfAPIVer + "/",
		Paths:     invalidationPath{Quantity: len(paths), Items: paths},
		CallerRef: uuid.New().String(),
	}
	payload, err := xml.MarshalIndent(batch, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal invalidation body: %w", err)
	}
	body := []byte(xml.Header + string(payload))

	uri := "/" + cfAPIVer + "/distribution/" + distID + "/invalidation"
	resp, err := p.signedRequest(
		ctx, http.MethodPost, uri, body,
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf(
			"CreateInvalidation failed(%d): %s",
			resp.StatusCode, string(respBody),
		)
	}
	return nil
}

// signedRequest 发送带 AWS SigV4 签名的 HTTP 请求。
func (p *Provider) signedRequest(
	ctx context.Context, method, uri string, payload []byte,
) (*http.Response, error) {
	now := time.Now().UTC()
	timestamp := now.Format("20060102T150405Z")
	date := now.Format("20060102")

	payloadHash := sha256Hex(payload)

	reqURL := cfEndpoint + uri
	req, err := http.NewRequestWithContext(
		ctx, method, reqURL, bytes.NewReader(payload),
	)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	host := "cloudfront.amazonaws.com"
	req.Header.Set("Host", host)
	req.Header.Set("X-Amz-Date", timestamp)
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)
	if method == http.MethodPost {
		req.Header.Set("Content-Type", "text/xml")
	}

	auth := buildSigV4Auth(
		method, uri, host, timestamp, date, payloadHash,
		p.account.AccessKey, p.account.SecretKey,
		req.Header,
	)
	req.Header.Set("Authorization", auth)

	return http.DefaultClient.Do(req)
}

// buildSigV4Auth 构建 AWS Signature V4 Authorization header 值。
func buildSigV4Auth(
	method, uri, host, timestamp, date, payloadHash string,
	accessKey, secretKey string,
	headers http.Header,
) string {
	// 收集需要签名的 header
	signedMap := map[string]string{
		"host":                 host,
		"x-amz-content-sha256": payloadHash,
		"x-amz-date":          timestamp,
	}
	if ct := headers.Get("Content-Type"); ct != "" {
		signedMap["content-type"] = ct
	}

	// 排序 header 名
	keys := make([]string, 0, len(signedMap))
	for k := range signedMap {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// 构建 canonical headers 和 signed headers
	var canonHeaders strings.Builder
	for _, k := range keys {
		canonHeaders.WriteString(k + ":" + signedMap[k] + "\n")
	}
	signedHeaders := strings.Join(keys, ";")

	// Canonical Request
	canonReq := strings.Join([]string{
		method, uri, "",
		canonHeaders.String(),
		signedHeaders,
		payloadHash,
	}, "\n")

	// Credential Scope
	scope := date + "/" + cfRegion + "/" + cfService + "/aws4_request"

	// String to Sign
	strToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256", timestamp, scope, sha256Hex([]byte(canonReq)),
	}, "\n")

	// Signing Key
	kDate := hmacSHA256([]byte("AWS4"+secretKey), []byte(date))
	kRegion := hmacSHA256(kDate, []byte(cfRegion))
	kService := hmacSHA256(kRegion, []byte(cfService))
	kSigning := hmacSHA256(kService, []byte("aws4_request"))

	sig := hex.EncodeToString(hmacSHA256(kSigning, []byte(strToSign)))

	return fmt.Sprintf(
		"AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		accessKey, scope, signedHeaders, sig,
	)
}

// matchDistribution 根据域名匹配 CloudFront 分发。
func matchDistribution(
	dists []distributionSummary, host string,
) string {
	for _, d := range dists {
		if strings.EqualFold(d.DomainName, host) {
			return d.ID
		}
		for _, alias := range d.Aliases.Items {
			if strings.EqualFold(alias, host) {
				return d.ID
			}
		}
	}
	return ""
}

// groupURLsByHost 解析 URL 列表，按域名分组并提取路径。
func groupURLsByHost(urls []string) map[string][]string {
	result := make(map[string][]string)
	for _, raw := range urls {
		host, path := extractHostPath(raw)
		if host == "" {
			continue
		}
		result[host] = append(result[host], path)
	}
	return result
}

// extractHostPath 从 URL 中提取域名和路径。
func extractHostPath(rawURL string) (host, path string) {
	u, err := url.Parse(rawURL)
	if err != nil || u.Host == "" {
		return "", ""
	}
	p := u.Path
	if p == "" {
		p = "/"
	}
	return u.Host, p
}

func sha256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

func hmacSHA256(key, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}
