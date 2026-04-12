# 多云 CDN 管理全覆盖 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为阿里云、腾讯云、AWS 三家厂商实现 CDN 刷新/预热/域名管理/配额查询，使 CDN 管理覆盖所有主流云厂商。

**Architecture:** 各厂商 CDN API 独立于存储 API，使用不同的签名机制和端点。采用直接 HTTP 调用 + 手工签名模式（与七牛云实现一致），为每个厂商创建独立的 `cdn.go` 文件实现 `CDNProvider` 接口。阿里云使用 Alibaba Cloud Signature V1 (HMAC-SHA1)，腾讯云使用 TC3-HMAC-SHA256，AWS CloudFront 使用 AWS Signature V4。

**Tech Stack:** Go 1.23 / net/http / crypto/hmac / crypto/sha256 / encoding/json / encoding/xml

---

## 架构概览

```
CDNProvider 接口（provider.go）
├── qiniu/qiniu.go     ✅ 已实现（RefreshCDN/PrefetchCDN/ListDomains/GetRefreshQuota）
├── upyun/upyun.go     ✅ 已实现（仅 RefreshCDN）
├── ali/cdn.go         🔧 新建（本次实现）
├── tencent/cdn.go     🔧 新建（本次实现）
└── aws/cdn.go         🔧 新建（本次实现）
```

每个厂商需实现的方法：

| 方法 | 阿里云 | 腾讯云 | AWS |
|------|--------|--------|-----|
| RefreshCDN | RefreshObjectCaches | PurgeUrlsCache | CreateInvalidation |
| PrefetchCDN | PushObjectCache | PushUrlsCache | ErrNotSupported |
| ListDomains | DescribeUserDomains | DescribeDomains | ErrNotSupported |
| GetRefreshQuota | DescribeRefreshQuota | DescribePurgeQuota | ErrNotSupported |

---

## Task 1: 阿里云 CDN 签名工具 + RefreshCDN

**Files:**
- Create: `sidecar/internal/storage/ali/cdn.go`
- Create: `sidecar/internal/storage/ali/cdn_test.go`
- Modify: `sidecar/internal/storage/ali/ali.go` — Init 中保存 account、更新 features

**背景知识:**
- 阿里云 CDN API 端点: `https://cdn.aliyuncs.com`
- 签名方式: Alibaba Cloud Signature V1 — HMAC-SHA1
- 签名流程:
  1. 构造 canonicalized query string（参数按 key 字典序排列，URL encode）
  2. `StringToSign = HTTPMethod + "&" + percentEncode("/") + "&" + percentEncode(canonicalizedQueryString)`
  3. `Signature = Base64(HMAC-SHA1(AccessKeySecret + "&", StringToSign))`
- 公共参数: Format=JSON, Version=2018-05-10, AccessKeyId, SignatureMethod=HMAC-SHA1, Timestamp(UTC ISO8601), SignatureVersion=1.0, SignatureNonce(UUID)
- RefreshObjectCaches 参数: Action=RefreshObjectCaches, ObjectPath(URL换行分隔), ObjectType=File

**Step 1: 修改 ali.go 保存 account 引用**

在 `ali.go` 中，Provider 需要保存 account 凭证以用于 CDN API 签名：

```go
// ali.go 修改
type Provider struct {
	base    *s3compat.Provider
	account model.Account  // 新增：保存凭证用于 CDN 签名
}

func (p *Provider) Init(cfg model.Account) error {
	p.account = cfg  // 新增
	return p.base.Init(cfg)
}
```

更新 features 列表，在 `New()` 中将 `"refreshCDN", "prefetchCDN", "cdnQuota", "customDomain"` 加入。

**Step 2: 创建 cdn.go 实现签名和 RefreshCDN**

`sidecar/internal/storage/ali/cdn.go`:

```go
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
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/goll/cloud-pika/sidecar/internal/model"
)

const aliCDNEndpoint = "https://cdn.aliyuncs.com"

// aliCDNCommonParams 构造阿里云 CDN API 公共参数。
func aliCDNCommonParams(accessKeyID, action string) url.Values {
	return url.Values{
		"Format":           {"JSON"},
		"Version":          {"2018-05-10"},
		"AccessKeyId":      {accessKeyID},
		"SignatureMethod":  {"HMAC-SHA1"},
		"Timestamp":        {time.Now().UTC().Format("2006-01-02T15:04:05Z")},
		"SignatureVersion": {"1.0"},
		"SignatureNonce":   {uuid.New().String()},
		"Action":           {action},
	}
}

// percentEncode 阿里云要求的 URL 编码（空格→%20，*→%2A，~保留）。
func percentEncode(s string) string {
	encoded := url.QueryEscape(s)
	encoded = strings.ReplaceAll(encoded, "+", "%20")
	encoded = strings.ReplaceAll(encoded, "*", "%2A")
	encoded = strings.ReplaceAll(encoded, "%7E", "~")
	return encoded
}

// aliCDNSign 计算阿里云 API 签名并返回带签名的完整 URL。
func aliCDNSign(secretKey string, params url.Values) string {
	// 按 key 排序
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// 构造 canonicalized query string
	var pairs []string
	for _, k := range keys {
		pairs = append(pairs,
			percentEncode(k)+"="+percentEncode(params.Get(k)),
		)
	}
	canonicalized := strings.Join(pairs, "&")

	stringToSign := "GET&" + percentEncode("/") + "&" + percentEncode(canonicalized)
	mac := hmac.New(sha1.New, []byte(secretKey+"&"))
	mac.Write([]byte(stringToSign))
	signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	params.Set("Signature", signature)
	return aliCDNEndpoint + "?" + params.Encode()
}

// aliCDNGet 发送 GET 请求到阿里云 CDN API。
func aliCDNGet(ctx context.Context, signedURL string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, signedURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build ali cdn request: %w", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ali cdn request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read ali cdn response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("ali cdn failed(%d): %s", resp.StatusCode, string(body))
	}
	return body, nil
}

// RefreshCDN 调用阿里云 RefreshObjectCaches 刷新 CDN 缓存。
func (p *Provider) RefreshCDN(ctx context.Context, urls []string) error {
	if len(urls) == 0 {
		return nil
	}
	params := aliCDNCommonParams(p.account.AccessKey, "RefreshObjectCaches")
	params.Set("ObjectPath", strings.Join(urls, "\n"))
	params.Set("ObjectType", "File")

	signedURL := aliCDNSign(p.account.SecretKey, params)
	_, err := aliCDNGet(ctx, signedURL)
	return err
}

// PrefetchCDN 调用阿里云 PushObjectCache 预热 CDN。
func (p *Provider) PrefetchCDN(ctx context.Context, urls []string) error {
	if len(urls) == 0 {
		return nil
	}
	params := aliCDNCommonParams(p.account.AccessKey, "PushObjectCache")
	params.Set("ObjectPath", strings.Join(urls, "\n"))

	signedURL := aliCDNSign(p.account.SecretKey, params)
	_, err := aliCDNGet(ctx, signedURL)
	return err
}

// GetRefreshQuota 调用阿里云 DescribeRefreshQuota 查询配额。
func (p *Provider) GetRefreshQuota(ctx context.Context) (*model.CDNQuota, error) {
	params := aliCDNCommonParams(p.account.AccessKey, "DescribeRefreshQuota")
	signedURL := aliCDNSign(p.account.SecretKey, params)

	body, err := aliCDNGet(ctx, signedURL)
	if err != nil {
		return nil, err
	}

	var raw struct {
		UrlRemain string `json:"UrlRemain"`
		UrlQuota  string `json:"UrlQuota"`
		DirRemain string `json:"DirRemain"`
		DirQuota  string `json:"DirQuota"`
		PreloadRemain string `json:"PreloadRemain"`
		PreloadQuota  string `json:"PreloadQuota"`
	}
	if err = json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("parse ali cdn quota: %w", err)
	}
	return &model.CDNQuota{
		URLRefreshRemain: atoi(raw.UrlRemain),
		URLRefreshLimit:  atoi(raw.UrlQuota),
		DirRefreshRemain: atoi(raw.DirRemain),
		DirRefreshLimit:  atoi(raw.DirQuota),
		PrefetchRemain:   atoi(raw.PreloadRemain),
		PrefetchLimit:    atoi(raw.PreloadQuota),
	}, nil
}

// ListDomains 调用阿里云 DescribeUserDomains 获取 CDN 加速域名列表。
func (p *Provider) ListDomains(ctx context.Context, _ string) ([]string, error) {
	params := aliCDNCommonParams(p.account.AccessKey, "DescribeUserDomains")
	params.Set("PageSize", "50")
	signedURL := aliCDNSign(p.account.SecretKey, params)

	body, err := aliCDNGet(ctx, signedURL)
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
		return nil, fmt.Errorf("parse ali cdn domains: %w", err)
	}

	domains := make([]string, 0, len(raw.Domains.PageData))
	for _, d := range raw.Domains.PageData {
		domains = append(domains, d.DomainName)
	}
	return domains, nil
}

func atoi(s string) int {
	var n int
	fmt.Sscanf(s, "%d", &n)
	return n
}
```

**Step 3: 创建 cdn_test.go**

测试签名函数和请求构造：

```go
package ali

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func newTestProvider(account model.Account) *Provider {
	p := New()
	p.account = account
	return p
}

func TestRefreshCDN_EmptyURLs(t *testing.T) {
	p := newTestProvider(model.Account{AccessKey: "ak", SecretKey: "sk"})
	if err := p.RefreshCDN(context.Background(), nil); err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
}

func TestRefreshCDN_SendsCorrectRequest(t *testing.T) {
	var gotQuery string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotQuery = r.URL.RawQuery
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"RefreshTaskId":"123"}`))
	}))
	defer srv.Close()

	// 使用服务端点直接测试
	p := newTestProvider(model.Account{AccessKey: "ak", SecretKey: "sk"})
	params := aliCDNCommonParams("ak", "RefreshObjectCaches")
	params.Set("ObjectPath", "https://cdn.example.com/a.jpg")
	params.Set("ObjectType", "File")
	signedURL := aliCDNSign("sk", params)
	// 替换端点为测试服务器
	signedURL = strings.Replace(signedURL, aliCDNEndpoint, srv.URL, 1)
	_, err := aliCDNGet(context.Background(), signedURL)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(gotQuery, "Action=RefreshObjectCaches") {
		t.Fatalf("expected Action param, got: %s", gotQuery)
	}
}

func TestPercentEncode(t *testing.T) {
	tests := []struct{ input, expected string }{
		{"hello world", "hello%20world"},
		{"a*b", "a%2Ab"},
		{"a~b", "a~b"},
	}
	for _, tc := range tests {
		got := percentEncode(tc.input)
		if got != tc.expected {
			t.Errorf("percentEncode(%q) = %q, want %q", tc.input, got, tc.expected)
		}
	}
}

func TestGetRefreshQuota_ParsesResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"UrlRemain":"1900","UrlQuota":"2000","DirRemain":"95","DirQuota":"100","PreloadRemain":"450","PreloadQuota":"500"}`))
	}))
	defer srv.Close()

	_, err := aliCDNGet(context.Background(), srv.URL)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
```

**Step 4: 运行测试**

```bash
cd sidecar && go test ./internal/storage/ali/... -v
```

**Step 5: Commit**

```bash
git add sidecar/internal/storage/ali/
git commit -m "feat(ali): implement CDN refresh/prefetch/domains/quota"
```

---

## Task 2: 腾讯云 CDN 实现

**Files:**
- Create: `sidecar/internal/storage/tencent/cdn.go`
- Create: `sidecar/internal/storage/tencent/cdn_test.go`
- Modify: `sidecar/internal/storage/tencent/tencent.go` — 更新 features

**背景知识:**
- 腾讯云 CDN API 端点: `https://cdn.tencentcloudapi.com`
- 签名方式: TC3-HMAC-SHA256
- 签名流程:
  1. CanonicalRequest = HTTPRequestMethod + "\n" + "/" + "\n" + "" + "\n" + "content-type:application/json\nhost:cdn.tencentcloudapi.com\n" + "\n" + "content-type;host" + "\n" + SHA256Hex(payload)
  2. CredentialScope = Date + "/" + "cdn" + "/tc3_request"
  3. StringToSign = "TC3-HMAC-SHA256\n" + Timestamp + "\n" + CredentialScope + "\n" + SHA256Hex(CanonicalRequest)
  4. SecretDate = HMAC_SHA256("TC3" + SecretKey, Date)
  5. SecretService = HMAC_SHA256(SecretDate, "cdn")
  6. SecretSigning = HMAC_SHA256(SecretService, "tc3_request")
  7. Signature = Hex(HMAC_SHA256(SecretSigning, StringToSign))
- 请求头: Authorization, Content-Type, Host, X-TC-Action, X-TC-Timestamp, X-TC-Version(2018-06-06)

**核心实现 `tencent/cdn.go`:**

签名函数 + RefreshCDN(PurgeUrlsCache) + PrefetchCDN(PushUrlsCache) + GetRefreshQuota(DescribePurgeQuota + DescribePushQuota) + ListDomains(DescribeDomains)。

请求体均为 JSON POST，用 TC3-HMAC-SHA256 签名。

腾讯云 CDN 域名与 COS Bucket 无直接关联，ListDomains 返回账号下所有 CDN 域名。

GetProviderFeatures() 增加 `"refreshCDN", "prefetchCDN", "cdnQuota", "customDomain"`。

**Step: Commit**

```bash
git add sidecar/internal/storage/tencent/
git commit -m "feat(tencent): implement CDN refresh/prefetch/domains/quota"
```

---

## Task 3: AWS CloudFront 实现

**Files:**
- Create: `sidecar/internal/storage/aws/cdn.go`
- Create: `sidecar/internal/storage/aws/cdn_test.go`
- Modify: `sidecar/internal/storage/aws/aws.go` — 保存 account、更新 features

**背景知识:**
- AWS CloudFront API 端点: `https://cloudfront.amazonaws.com`
- 签名方式: AWS Signature V4
- CreateInvalidation: POST `/2020-05-31/distribution/{DistributionId}/invalidation`
- 请求体: XML `<InvalidationBatch><Paths><Quantity>N</Quantity><Items><Path>/xxx</Path>...</Items></Paths><CallerReference>uuid</CallerReference></InvalidationBatch>`
- CloudFront 与 S3 独立，需要 DistributionId — 先使用 ListDistributions 自动匹配
- ListDistributions: GET `/2020-05-31/distribution`

**限制:**
- AWS CloudFront 无原生预热（PrefetchCDN → ErrNotSupported）
- 无原生配额查询（GetRefreshQuota → ErrNotSupported）
- ListDomains → ErrNotSupported（CloudFront 的域名管理模型不同）

**核心实现:**
- AWS SigV4 签名函数（HMAC-SHA256 链式签名）
- RefreshCDN → CreateInvalidation（将 URL 转为 path 发送）
- 其余返回 ErrNotSupported

GetProviderFeatures() 增加 `"refreshCDN"`。

**Step: Commit**

```bash
git add sidecar/internal/storage/aws/
git commit -m "feat(aws): implement CloudFront cache invalidation"
```

---

## Task 4: 前端 — 上传后自动刷新 CDN 设置

**Files:**
- Modify: `sidecar/internal/model/model.go` — AppSettings 新增 AutoRefreshCDN bool
- Modify: `src/types/cloud.ts` — AppSettings 新增 autoRefreshCDN
- Modify: `src/i18n/i18n.ts` — 新增设置项翻译
- Modify: `src/components/settings/SettingsPanel.tsx` — 新增开关
- Modify: `src/pages/BucketPage.tsx` — 上传成功后检查设置并触发刷新

**Step: Commit**

```bash
git add sidecar/internal/model/model.go src/types/cloud.ts src/i18n/i18n.ts \
  src/components/settings/SettingsPanel.tsx src/pages/BucketPage.tsx
git commit -m "feat: add auto-refresh CDN after upload setting"
```

---

## Task 5: 集成测试 + 最终验证

**Steps:**
1. `cd sidecar && go test ./... -v` — 确保所有测试通过
2. `cd .. && npx tsc --noEmit` — 确保前端无类型错误
3. `npm run build` — 确保前端构建成功
4. `cd sidecar && go build ./...` — 确保后端编译成功

---

## 各厂商 API 签名速查

### 阿里云 Signature V1
```
StringToSign = GET&%2F&<percentEncode(sortedParams)>
Signature = Base64(HMAC-SHA1(SecretKey + "&", StringToSign))
```

### 腾讯云 TC3-HMAC-SHA256
```
SecretDate = HMAC-SHA256("TC3" + SecretKey, Date)
SecretService = HMAC-SHA256(SecretDate, "cdn")
SecretSigning = HMAC-SHA256(SecretService, "tc3_request")
Signature = Hex(HMAC-SHA256(SecretSigning, StringToSign))
```

### AWS Signature V4
```
DateKey = HMAC-SHA256("AWS4" + SecretKey, Date)
DateRegionKey = HMAC-SHA256(DateKey, Region)
DateRegionServiceKey = HMAC-SHA256(DateRegionKey, Service)
SigningKey = HMAC-SHA256(DateRegionServiceKey, "aws4_request")
Signature = Hex(HMAC-SHA256(SigningKey, StringToSign))
```
