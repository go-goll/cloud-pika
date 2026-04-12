package ali

import (
	"context"
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
	p := newTestProvider(model.Account{
		AccessKey: "ak", SecretKey: "sk",
	})
	if err := p.RefreshCDN(context.Background(), nil); err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
}

func TestRefreshCDN_SendsCorrectRequest(t *testing.T) {
	var gotAction, gotObjectPath, gotObjectType string
	srv := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			gotAction = r.URL.Query().Get("Action")
			gotObjectPath = r.URL.Query().Get("ObjectPath")
			gotObjectType = r.URL.Query().Get("ObjectType")
			w.WriteHeader(http.StatusOK)
		},
	))
	defer srv.Close()

	p := newTestProvider(model.Account{
		AccessKey: "ak", SecretKey: "sk",
	})
	urls := []string{
		"https://cdn.example.com/a.jpg",
		"https://cdn.example.com/b.png",
	}
	err := p.refreshCDNWithEndpoint(ctx(), srv.URL, urls)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotAction != "RefreshObjectCaches" {
		t.Fatalf("expected Action=RefreshObjectCaches, got %s", gotAction)
	}
	if gotObjectType != "File" {
		t.Fatalf("expected ObjectType=File, got %s", gotObjectType)
	}
	if !strings.Contains(gotObjectPath, "a.jpg") ||
		!strings.Contains(gotObjectPath, "b.png") {
		t.Fatalf("unexpected ObjectPath: %s", gotObjectPath)
	}
}

func TestPrefetchCDN_EmptyURLs(t *testing.T) {
	p := newTestProvider(model.Account{
		AccessKey: "ak", SecretKey: "sk",
	})
	if err := p.PrefetchCDN(context.Background(), nil); err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
}

func TestPrefetchCDN_SendsCorrectRequest(t *testing.T) {
	var gotAction, gotObjectPath string
	srv := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			gotAction = r.URL.Query().Get("Action")
			gotObjectPath = r.URL.Query().Get("ObjectPath")
			w.WriteHeader(http.StatusOK)
		},
	))
	defer srv.Close()

	p := newTestProvider(model.Account{
		AccessKey: "ak", SecretKey: "sk",
	})
	err := p.prefetchCDNWithEndpoint(
		ctx(), srv.URL, []string{"https://cdn.example.com/b.js"},
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotAction != "PushObjectCache" {
		t.Fatalf("expected Action=PushObjectCache, got %s", gotAction)
	}
	if gotObjectPath != "https://cdn.example.com/b.js" {
		t.Fatalf("unexpected ObjectPath: %s", gotObjectPath)
	}
}

func TestGetRefreshQuota_ParsesResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			resp := `{
				"UrlRemain": "900",
				"UrlQuota": "1000",
				"DirRemain": "90",
				"DirQuota": "100",
				"PreloadRemain": "450",
				"PreloadQuota": "500"
			}`
			w.Write([]byte(resp))
		},
	))
	defer srv.Close()

	p := newTestProvider(model.Account{
		AccessKey: "ak", SecretKey: "sk",
	})
	quota, err := p.getRefreshQuotaWithEndpoint(ctx(), srv.URL)
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

func TestListDomains_ParsesResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			resp := `{
				"Domains": {
					"PageData": [
						{"DomainName": "cdn1.example.com"},
						{"DomainName": "cdn2.example.com"}
					]
				}
			}`
			w.Write([]byte(resp))
		},
	))
	defer srv.Close()

	p := newTestProvider(model.Account{
		AccessKey: "ak", SecretKey: "sk",
	})
	domains, err := p.listDomainsWithEndpoint(ctx(), srv.URL)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(domains) != 2 {
		t.Fatalf("expected 2 domains, got %d", len(domains))
	}
	if domains[0] != "cdn1.example.com" || domains[1] != "cdn2.example.com" {
		t.Fatalf("unexpected domains: %v", domains)
	}
}

func TestPercentEncode(t *testing.T) {
	tests := []struct {
		input, expected string
	}{
		{"hello world", "hello%20world"},
		{"test*value", "test%2Avalue"},
		{"keep~tilde", "keep~tilde"},
		{"/path/to/file", "%2Fpath%2Fto%2Ffile"},
		{"a=b&c=d", "a%3Db%26c%3Dd"},
	}
	for _, tt := range tests {
		got := percentEncode(tt.input)
		if got != tt.expected {
			t.Errorf(
				"percentEncode(%q) = %q, want %q",
				tt.input, got, tt.expected,
			)
		}
	}
}

func TestSignRequest_Format(t *testing.T) {
	params := map[string]string{
		"Action":           "DescribeRefreshQuota",
		"Format":           "JSON",
		"Version":          "2018-05-10",
		"AccessKeyId":      "testAK",
		"SignatureMethod":  "HMAC-SHA1",
		"Timestamp":        "2024-01-01T00:00:00Z",
		"SignatureVersion": "1.0",
		"SignatureNonce":   "test-nonce",
	}

	qs := signRequest("testAK", "testSK", params)
	if !strings.Contains(qs, "Signature=") {
		t.Fatal("signed query string should contain Signature")
	}
	if !strings.Contains(qs, "Action=DescribeRefreshQuota") {
		t.Fatal("signed query string should contain Action")
	}
}

func TestRefreshCDN_ErrorResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"Code":"Forbidden"}`))
		},
	))
	defer srv.Close()

	p := newTestProvider(model.Account{
		AccessKey: "ak", SecretKey: "sk",
	})
	err := p.refreshCDNWithEndpoint(
		ctx(), srv.URL, []string{"https://cdn.example.com/a.jpg"},
	)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func ctx() context.Context { return context.Background() }
