package tencent

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

const cdnEndpoint = "https://cdn.tencentcloudapi.com"
const cdnHost = "cdn.tencentcloudapi.com"
const cdnAPIVersion = "2018-06-06"

// RefreshCDN 提交 URL 刷新请求（PurgeUrlsCache）。
func (p *Provider) RefreshCDN(
	ctx context.Context, urls []string,
) error {
	if len(urls) == 0 {
		return nil
	}
	body := map[string][]string{"Urls": urls}
	_, err := p.cdnRequest(ctx, "PurgeUrlsCache", body)
	return err
}

// PrefetchCDN 提交 URL 预热请求（PushUrlsCache）。
func (p *Provider) PrefetchCDN(
	ctx context.Context, urls []string,
) error {
	if len(urls) == 0 {
		return nil
	}
	body := map[string][]string{"Urls": urls}
	_, err := p.cdnRequest(ctx, "PushUrlsCache", body)
	return err
}

// purgeQuotaResponse 腾讯云 DescribePurgeQuota 响应结构。
type purgeQuotaResponse struct {
	Response struct {
		PurgeQuota []purgeQuotaItem `json:"PurgeQuota"`
	} `json:"Response"`
}

type purgeQuotaItem struct {
	Urls            int `json:"Urls"`
	UrlsPurge       int `json:"UrlsPurge"`
	Directories     int `json:"Directories"`
	DirectoriesPurge int `json:"DirectoriesPurge"`
}

// GetRefreshQuota 查询 CDN 刷新配额（DescribePurgeQuota）。
func (p *Provider) GetRefreshQuota(
	ctx context.Context,
) (*model.CDNQuota, error) {
	data, err := p.cdnRequest(
		ctx, "DescribePurgeQuota", struct{}{},
	)
	if err != nil {
		return nil, err
	}

	var resp purgeQuotaResponse
	if err = json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("parse purge quota: %w", err)
	}

	quota := &model.CDNQuota{}
	if len(resp.Response.PurgeQuota) > 0 {
		q := resp.Response.PurgeQuota[0]
		quota.URLRefreshLimit = q.Urls
		quota.URLRefreshRemain = q.Urls - q.UrlsPurge
		quota.DirRefreshLimit = q.Directories
		quota.DirRefreshRemain = q.Directories - q.DirectoriesPurge
	}
	return quota, nil
}

// domainsResponse 腾讯云 DescribeDomains 响应结构。
type domainsResponse struct {
	Response struct {
		Domains []struct {
			Domain string `json:"Domain"`
		} `json:"Domains"`
	} `json:"Response"`
}

// ListDomains 查询 CDN 域名列表（DescribeDomains）。
func (p *Provider) ListDomains(
	ctx context.Context, _ string,
) ([]string, error) {
	body := map[string]int{"Limit": 100, "Offset": 0}
	data, err := p.cdnRequest(ctx, "DescribeDomains", body)
	if err != nil {
		return nil, err
	}

	var resp domainsResponse
	if err = json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("parse domains: %w", err)
	}

	domains := make([]string, 0, len(resp.Response.Domains))
	for _, d := range resp.Response.Domains {
		domains = append(domains, d.Domain)
	}
	return domains, nil
}

// cdnRequest 向腾讯云 CDN API 发送带 TC3-HMAC-SHA256 签名的请求。
func (p *Provider) cdnRequest(
	ctx context.Context, action string, payload any,
) ([]byte, error) {
	return p.cdnRequestWithEndpoint(
		ctx, cdnEndpoint, action, payload,
	)
}

// cdnRequestWithEndpoint 带自定义端点的 CDN API 请求，便于测试。
func (p *Provider) cdnRequestWithEndpoint(
	ctx context.Context,
	endpoint, action string,
	payload any,
) ([]byte, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal payload: %w", err)
	}

	now := time.Now().UTC()
	timestamp := strconv.FormatInt(now.Unix(), 10)

	auth := p.buildTC3Authorization(
		timestamp, now, payloadBytes,
	)

	req, err := http.NewRequestWithContext(
		ctx, http.MethodPost, endpoint,
		bytes.NewReader(payloadBytes),
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Host", cdnHost)
	req.Header.Set("X-TC-Action", action)
	req.Header.Set("X-TC-Timestamp", timestamp)
	req.Header.Set("X-TC-Version", cdnAPIVersion)
	req.Header.Set("Authorization", auth)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read cdn response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf(
			"cdn api %s failed (%d): %s",
			action, resp.StatusCode, string(data),
		)
	}
	return data, nil
}

// buildTC3Authorization 构建 TC3-HMAC-SHA256 签名授权头。
func (p *Provider) buildTC3Authorization(
	timestamp string, t time.Time, payload []byte,
) string {
	date := t.Format("2006-01-02")
	credentialScope := date + "/cdn/tc3_request"

	canonicalHeaders := "content-type:application/json\n" +
		"host:" + cdnHost + "\n"
	signedHeaders := "content-type;host"
	hashedPayload := sha256Hex(payload)

	canonicalRequest := "POST\n/\n\n" +
		canonicalHeaders + "\n" +
		signedHeaders + "\n" +
		hashedPayload

	stringToSign := "TC3-HMAC-SHA256\n" +
		timestamp + "\n" +
		credentialScope + "\n" +
		sha256Hex([]byte(canonicalRequest))

	// 派生签名密钥
	secretDate := hmacSHA256Bytes(
		[]byte("TC3"+p.account.SecretKey), []byte(date),
	)
	secretService := hmacSHA256Bytes(
		secretDate, []byte("cdn"),
	)
	secretSigning := hmacSHA256Bytes(
		secretService, []byte("tc3_request"),
	)
	signature := hex.EncodeToString(
		hmacSHA256Bytes(secretSigning, []byte(stringToSign)),
	)

	return "TC3-HMAC-SHA256" +
		" Credential=" + p.account.AccessKey +
		"/" + credentialScope +
		", SignedHeaders=" + signedHeaders +
		", Signature=" + signature
}

// sha256Hex 计算数据的 SHA256 十六进制摘要。
func sha256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

// hmacSHA256Bytes 使用 key 对 data 做 HMAC-SHA256，返回原始字节。
func hmacSHA256Bytes(key, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}
