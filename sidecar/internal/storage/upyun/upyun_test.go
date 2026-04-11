package upyun

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func TestRefreshCDN_SendsPurgeRequest(t *testing.T) {
	var gotBody string
	var gotContentType string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotContentType = r.Header.Get("Content-Type")
		b, _ := io.ReadAll(r.Body)
		gotBody = string(b)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"result":[]}`))
	}))
	defer srv.Close()

	p := &Provider{
		account: model.Account{
			AccessKey:   "operator",
			SecretKey:   "password",
			ServiceName: "mybucket",
		},
	}

	urls := []string{"https://cdn.example.com/a.jpg", "https://cdn.example.com/b.js"}
	err := p.refreshCDNWithURL(context.Background(), srv.URL, urls)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !strings.Contains(gotContentType, "application/x-www-form-urlencoded") {
		t.Fatalf("expected form content type, got %s", gotContentType)
	}

	if !strings.Contains(gotBody, "purge=") {
		t.Fatalf("expected purge= in body, got %s", gotBody)
	}
	// form-encoded body: purge=url1%0Aurl2
	decoded, _ := url.QueryUnescape(gotBody)
	if !strings.Contains(decoded, "cdn.example.com/a.jpg") {
		t.Fatalf("expected first URL in body, got %s", decoded)
	}
}

func TestRefreshCDN_EmptyURLs(t *testing.T) {
	p := &Provider{account: model.Account{AccessKey: "op", SecretKey: "pw"}}
	err := p.RefreshCDN(context.Background(), nil)
	if err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
}

func TestRefreshCDN_ErrorResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		w.Write([]byte("forbidden"))
	}))
	defer srv.Close()

	p := &Provider{
		account: model.Account{AccessKey: "op", SecretKey: "pw", ServiceName: "svc"},
	}
	err := p.refreshCDNWithURL(context.Background(), srv.URL, []string{"https://a.com/1"})
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestPrefetchCDN_ReturnsNotSupported(t *testing.T) {
	p := &Provider{}
	err := p.PrefetchCDN(context.Background(), []string{"https://a.com/1"})
	if err != model.ErrNotSupported {
		t.Fatalf("expected ErrNotSupported, got %v", err)
	}
}

func TestGetRefreshQuota_ReturnsNotSupported(t *testing.T) {
	p := &Provider{}
	quota, err := p.GetRefreshQuota(context.Background())
	if err != model.ErrNotSupported {
		t.Fatalf("expected ErrNotSupported, got %v", err)
	}
	if quota != nil {
		t.Fatalf("expected nil quota, got %+v", quota)
	}
}
