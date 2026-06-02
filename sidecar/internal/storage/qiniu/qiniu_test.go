package qiniu

import (
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// TestQboxAccessToken 锁定七牛 QBox 管理凭证的签名规则：
// 签名串为 path(?query)+"\n"，HMAC-SHA1 后须用带 padding 的 URL 安全 base64
// （与官方 go-sdk auth.Sign 一致），否则七牛返回 BadToken。
func TestQboxAccessToken(t *testing.T) {
	const (
		ak     = "test-ak"
		sk     = "test-sk"
		rawURL = "https://rs.qbox.me/buckets"
	)

	got, err := qboxAccessToken(ak, sk, rawURL)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	mac := hmac.New(sha1.New, []byte(sk))
	mac.Write([]byte("/buckets\n"))
	want := ak + ":" + base64.URLEncoding.EncodeToString(mac.Sum(nil))

	if got != want {
		t.Fatalf("token 不匹配:\n got  %s\n want %s", got, want)
	}
}

func newTestProvider(account model.Account) *Provider {
	p := New()
	p.account = account
	return p
}

// TestPostCDNAction_SignatureExcludesBody 锁定七牛 CDN 管理请求的签名规则：
// CDN 用 QBox V1 签名 + application/json，body 不计入签名串（签名串仅为 path+"\n"），
// 若把 body 拼进签名会被七牛拒绝（401 BadToken）。
func TestPostCDNAction_SignatureExcludesBody(t *testing.T) {
	var gotAuth, gotPath string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	p := newTestProvider(model.Account{AccessKey: "ak", SecretKey: "sk"})
	err := p.refreshCDNWithURL(
		context.Background(),
		srv.URL+"/v2/tune/refresh",
		[]string{"https://cdn.example.com/a.jpg"},
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	mac := hmac.New(sha1.New, []byte("sk"))
	mac.Write([]byte(gotPath + "\n"))
	want := "QBox ak:" + base64.URLEncoding.EncodeToString(mac.Sum(nil))
	if gotAuth != want {
		t.Fatalf("CDN 签名不应包含 body:\n got  %s\n want %s", gotAuth, want)
	}
}

func TestRefreshCDN_EmptyURLs(t *testing.T) {
	p := newTestProvider(model.Account{AccessKey: "ak", SecretKey: "sk"})
	if err := p.RefreshCDN(context.Background(), nil); err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
}

func TestRefreshCDN_SendsCorrectRequest(t *testing.T) {
	var gotBody []byte
	var gotAuth string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotBody, _ = io.ReadAll(r.Body)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	p := newTestProvider(model.Account{AccessKey: "ak", SecretKey: "sk"})
	// 替换内部常量不可行，直接调用辅助函数验证签名逻辑
	err := p.refreshCDNWithURL(context.Background(), srv.URL+"/v2/tune/refresh", []string{"https://cdn.example.com/a.jpg"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotAuth == "" {
		t.Fatal("expected Authorization header")
	}

	var req cdnRefreshRequest
	if err := json.Unmarshal(gotBody, &req); err != nil {
		t.Fatalf("failed to parse body: %v", err)
	}
	if len(req.URLs) != 1 || req.URLs[0] != "https://cdn.example.com/a.jpg" {
		t.Fatalf("unexpected URLs: %v", req.URLs)
	}
}

func TestPrefetchCDN_EmptyURLs(t *testing.T) {
	p := newTestProvider(model.Account{AccessKey: "ak", SecretKey: "sk"})
	if err := p.PrefetchCDN(context.Background(), nil); err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
}

func TestPrefetchCDN_SendsCorrectRequest(t *testing.T) {
	var gotBody []byte
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotBody, _ = io.ReadAll(r.Body)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	p := newTestProvider(model.Account{AccessKey: "ak", SecretKey: "sk"})
	err := p.prefetchCDNWithURL(context.Background(), srv.URL+"/v2/tune/prefetch", []string{"https://cdn.example.com/b.js"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var req struct {
		URLs []string `json:"urls"`
	}
	if err := json.Unmarshal(gotBody, &req); err != nil {
		t.Fatalf("failed to parse body: %v", err)
	}
	if len(req.URLs) != 1 || req.URLs[0] != "https://cdn.example.com/b.js" {
		t.Fatalf("unexpected URLs: %v", req.URLs)
	}
}

func TestGetRefreshQuota_ParsesResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp := `{
			"urlSurplusDay": 900,
			"urlQuotaDay": 1000,
			"dirSurplusDay": 90,
			"dirQuotaDay": 100,
			"prefetchSurplusDay": 450,
			"prefetchQuotaDay": 500
		}`
		w.Write([]byte(resp))
	}))
	defer srv.Close()

	p := newTestProvider(model.Account{AccessKey: "ak", SecretKey: "sk"})
	quota, err := p.getRefreshQuotaWithURL(context.Background(), srv.URL+"/v2/tune/refresh/quota")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if quota.URLRefreshRemain != 900 || quota.URLRefreshLimit != 1000 {
		t.Fatalf("unexpected URL quota: %+v", quota)
	}
	if quota.DirRefreshRemain != 90 || quota.DirRefreshLimit != 100 {
		t.Fatalf("unexpected dir quota: %+v", quota)
	}
	if quota.PrefetchRemain != 450 || quota.PrefetchLimit != 500 {
		t.Fatalf("unexpected prefetch quota: %+v", quota)
	}
}

func TestRefreshCDN_ErrorResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		w.Write([]byte(`{"error":"rate limit exceeded"}`))
	}))
	defer srv.Close()

	p := newTestProvider(model.Account{AccessKey: "ak", SecretKey: "sk"})
	err := p.refreshCDNWithURL(context.Background(), srv.URL+"/v2/tune/refresh", []string{"https://cdn.example.com/a.jpg"})
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}
