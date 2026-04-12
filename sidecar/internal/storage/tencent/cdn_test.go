package tencent

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func newTestProvider() *Provider {
	p := New()
	_ = p.Init(model.Account{
		AccessKey: "test-ak",
		SecretKey: "test-sk",
	})
	return p
}

func TestRefreshCDN_EmptyURLs(t *testing.T) {
	p := newTestProvider()
	if err := p.RefreshCDN(context.Background(), nil); err != nil {
		t.Fatalf("expected nil for empty urls, got: %v", err)
	}
}

func TestPrefetchCDN_EmptyURLs(t *testing.T) {
	p := newTestProvider()
	err := p.PrefetchCDN(context.Background(), nil)
	if err != nil {
		t.Fatalf("expected nil for empty urls, got: %v", err)
	}
}

func TestRefreshCDN_RequestHeadersAndBody(t *testing.T) {
	var (
		gotAction  string
		gotVersion string
		gotBody    []byte
		gotAuth    string
	)

	srv := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			gotAction = r.Header.Get("X-TC-Action")
			gotVersion = r.Header.Get("X-TC-Version")
			gotAuth = r.Header.Get("Authorization")
			gotBody, _ = io.ReadAll(r.Body)
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"Response":{}}`))
		},
	))
	defer srv.Close()

	p := newTestProvider()
	urls := []string{
		"https://example.com/a.jpg",
		"https://example.com/b.jpg",
	}
	payload := map[string][]string{"Urls": urls}
	_, err := p.cdnRequestWithEndpoint(
		context.Background(), srv.URL,
		"PurgeUrlsCache", payload,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if gotAction != "PurgeUrlsCache" {
		t.Errorf("action = %q, want PurgeUrlsCache", gotAction)
	}
	if gotVersion != cdnAPIVersion {
		t.Errorf(
			"version = %q, want %q", gotVersion, cdnAPIVersion,
		)
	}

	var body map[string][]string
	if err = json.Unmarshal(gotBody, &body); err != nil {
		t.Fatalf("unmarshal body: %v", err)
	}
	if len(body["Urls"]) != 2 {
		t.Errorf("urls count = %d, want 2", len(body["Urls"]))
	}

	// 验证 TC3-HMAC-SHA256 签名格式
	if !strings.HasPrefix(gotAuth, "TC3-HMAC-SHA256") {
		t.Errorf("auth prefix wrong: %s", gotAuth)
	}
	if !strings.Contains(gotAuth, "Credential=test-ak/") {
		t.Errorf("auth missing credential: %s", gotAuth)
	}
	if !strings.Contains(gotAuth, "Signature=") {
		t.Errorf("auth missing signature: %s", gotAuth)
	}
}

func TestBuildTC3Authorization_Format(t *testing.T) {
	p := newTestProvider()
	payload := []byte(`{"Urls":["https://example.com/a"]}`)
	ts := "1704067200"
	ft := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)

	auth := p.buildTC3Authorization(ts, ft, payload)

	if !strings.HasPrefix(auth, "TC3-HMAC-SHA256 ") {
		t.Errorf("wrong algorithm prefix: %s", auth)
	}
	wantScope := "Credential=test-ak/2024-01-01/cdn/tc3_request"
	if !strings.Contains(auth, wantScope) {
		t.Errorf("missing credential scope in: %s", auth)
	}
	wantSH := "SignedHeaders=content-type;host"
	if !strings.Contains(auth, wantSH) {
		t.Errorf("missing signed headers in: %s", auth)
	}

	// 签名应为 64 字符十六进制
	sigIdx := strings.Index(auth, "Signature=")
	sig := auth[sigIdx+len("Signature="):]
	if len(sig) != 64 {
		t.Errorf("signature length = %d, want 64", len(sig))
	}
}

func TestGetRefreshQuota_ParseResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, _ *http.Request) {
			resp := `{
				"Response": {
					"PurgeQuota": [{
						"Area": "mainland",
						"Urls": 10000,
						"UrlsPurge": 100,
						"Directories": 200,
						"DirectoriesPurge": 5
					}]
				}
			}`
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(resp))
		},
	))
	defer srv.Close()

	p := newTestProvider()

	// 直接通过底层方法获取原始响应并解析
	data, err := p.cdnRequestWithEndpoint(
		context.Background(), srv.URL,
		"DescribePurgeQuota", struct{}{},
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp purgeQuotaResponse
	if err = json.Unmarshal(data, &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if len(resp.Response.PurgeQuota) != 1 {
		t.Fatalf(
			"quota items = %d, want 1",
			len(resp.Response.PurgeQuota),
		)
	}
	q := resp.Response.PurgeQuota[0]
	if q.Urls != 10000 {
		t.Errorf("url limit = %d, want 10000", q.Urls)
	}
	if remain := q.Urls - q.UrlsPurge; remain != 9900 {
		t.Errorf("url remain = %d, want 9900", remain)
	}
	if q.Directories != 200 {
		t.Errorf("dir limit = %d, want 200", q.Directories)
	}
	if dr := q.Directories - q.DirectoriesPurge; dr != 195 {
		t.Errorf("dir remain = %d, want 195", dr)
	}
}

func TestListDomains_ParseResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, _ *http.Request) {
			resp := `{
				"Response": {
					"Domains": [
						{"Domain": "cdn1.example.com"},
						{"Domain": "cdn2.example.com"}
					],
					"TotalNumber": 2
				}
			}`
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(resp))
		},
	))
	defer srv.Close()

	p := newTestProvider()
	data, err := p.cdnRequestWithEndpoint(
		context.Background(), srv.URL,
		"DescribeDomains",
		map[string]int{"Limit": 100, "Offset": 0},
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var resp domainsResponse
	if err = json.Unmarshal(data, &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(resp.Response.Domains) != 2 {
		t.Fatalf(
			"domains = %d, want 2",
			len(resp.Response.Domains),
		)
	}
	if resp.Response.Domains[0].Domain != "cdn1.example.com" {
		t.Errorf("domain[0] = %q", resp.Response.Domains[0].Domain)
	}
	if resp.Response.Domains[1].Domain != "cdn2.example.com" {
		t.Errorf("domain[1] = %q", resp.Response.Domains[1].Domain)
	}
}

func TestCDNRequest_HTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusForbidden)
			_, _ = w.Write([]byte(`{"Error":"forbidden"}`))
		},
	))
	defer srv.Close()

	p := newTestProvider()
	_, err := p.cdnRequestWithEndpoint(
		context.Background(), srv.URL,
		"PurgeUrlsCache",
		map[string][]string{"Urls": {"https://a.com"}},
	)
	if err == nil {
		t.Fatal("expected error for 403 response")
	}
	if !strings.Contains(err.Error(), "403") {
		t.Errorf("error should contain 403: %v", err)
	}
}
