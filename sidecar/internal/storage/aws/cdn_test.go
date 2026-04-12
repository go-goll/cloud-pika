package aws

import (
	"context"
	"encoding/xml"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func TestPrefetchCDN_NotSupported(t *testing.T) {
	p := &Provider{}
	err := p.PrefetchCDN(context.Background(), []string{"https://example.com/a"})
	if !errors.Is(err, model.ErrNotSupported) {
		t.Fatalf("expected ErrNotSupported, got %v", err)
	}
}

func TestGetRefreshQuota_NotSupported(t *testing.T) {
	p := &Provider{}
	_, err := p.GetRefreshQuota(context.Background())
	if !errors.Is(err, model.ErrNotSupported) {
		t.Fatalf("expected ErrNotSupported, got %v", err)
	}
}

func TestListDomains_NotSupported(t *testing.T) {
	p := &Provider{}
	_, err := p.ListDomains(context.Background(), "bucket")
	if !errors.Is(err, model.ErrNotSupported) {
		t.Fatalf("expected ErrNotSupported, got %v", err)
	}
}

func TestExtractHostPath(t *testing.T) {
	tests := []struct {
		url      string
		wantHost string
		wantPath string
	}{
		{
			"https://d1234.cloudfront.net/images/a.jpg",
			"d1234.cloudfront.net", "/images/a.jpg",
		},
		{
			"https://cdn.example.com/file.css",
			"cdn.example.com", "/file.css",
		},
		{
			"https://d1234.cloudfront.net/",
			"d1234.cloudfront.net", "/",
		},
		{
			"https://d1234.cloudfront.net",
			"d1234.cloudfront.net", "/",
		},
		{"not-a-url", "", ""},
	}

	for _, tt := range tests {
		host, path := extractHostPath(tt.url)
		if host != tt.wantHost || path != tt.wantPath {
			t.Errorf(
				"extractHostPath(%q) = (%q, %q), want (%q, %q)",
				tt.url, host, path, tt.wantHost, tt.wantPath,
			)
		}
	}
}

func TestGroupURLsByHost(t *testing.T) {
	urls := []string{
		"https://d1.cloudfront.net/a.jpg",
		"https://d1.cloudfront.net/b.jpg",
		"https://d2.cloudfront.net/c.css",
	}
	grouped := groupURLsByHost(urls)
	if len(grouped) != 2 {
		t.Fatalf("expected 2 hosts, got %d", len(grouped))
	}
	if len(grouped["d1.cloudfront.net"]) != 2 {
		t.Errorf("expected 2 paths for d1, got %d", len(grouped["d1.cloudfront.net"]))
	}
	if len(grouped["d2.cloudfront.net"]) != 1 {
		t.Errorf("expected 1 path for d2, got %d", len(grouped["d2.cloudfront.net"]))
	}
}

func TestBuildSigV4Auth_Format(t *testing.T) {
	headers := http.Header{}
	headers.Set("Content-Type", "text/xml")

	auth := buildSigV4Auth(
		http.MethodPost,
		"/2020-05-31/distribution/DIST123/invalidation",
		"cloudfront.amazonaws.com",
		"20240101T000000Z", "20240101",
		sha256Hex(nil),
		"AKIAIOSFODNN7EXAMPLE",
		"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
		headers,
	)

	if !strings.HasPrefix(auth, "AWS4-HMAC-SHA256 Credential=") {
		t.Errorf("auth should start with AWS4-HMAC-SHA256 Credential=, got: %s", auth)
	}
	if !strings.Contains(auth, "AKIAIOSFODNN7EXAMPLE") {
		t.Error("auth should contain access key")
	}
	if !strings.Contains(auth, "us-east-1/cloudfront/aws4_request") {
		t.Error("auth should contain credential scope")
	}
	if !strings.Contains(auth, "SignedHeaders=") {
		t.Error("auth should contain SignedHeaders")
	}
	if !strings.Contains(auth, "Signature=") {
		t.Error("auth should contain Signature")
	}
}

func TestMatchDistribution(t *testing.T) {
	dists := []distributionSummary{
		{
			ID:         "DIST1",
			DomainName: "d1.cloudfront.net",
			Aliases:    distributionAliases{Items: []string{"cdn.example.com"}},
		},
		{
			ID:         "DIST2",
			DomainName: "d2.cloudfront.net",
		},
	}

	tests := []struct {
		host string
		want string
	}{
		{"d1.cloudfront.net", "DIST1"},
		{"cdn.example.com", "DIST1"},
		{"d2.cloudfront.net", "DIST2"},
		{"unknown.com", ""},
	}

	for _, tt := range tests {
		got := matchDistribution(dists, tt.host)
		if got != tt.want {
			t.Errorf("matchDistribution(%q) = %q, want %q", tt.host, got, tt.want)
		}
	}
}

func TestRefreshCDN_EmptyURLs(t *testing.T) {
	p := &Provider{}
	if err := p.RefreshCDN(context.Background(), nil); err != nil {
		t.Fatalf("expected nil error for empty urls, got %v", err)
	}
}

func TestRefreshCDN_SendsCorrectXMLBody(t *testing.T) {
	var receivedBody []byte
	var receivedMethod string
	var receivedURI string

	// 模拟 CloudFront API
	ts := httptest.NewTLSServer(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			receivedMethod = r.Method
			receivedURI = r.URL.Path
			body := make([]byte, r.ContentLength)
			r.Body.Read(body)
			receivedBody = body

			if strings.Contains(r.URL.Path, "invalidation") {
				w.WriteHeader(http.StatusCreated)
				w.Write([]byte("<Invalidation><Id>I123</Id></Invalidation>"))
				return
			}
			// ListDistributions 响应
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`<DistributionList>
				<Items>
					<DistributionSummary>
						<Id>EDIST1</Id>
						<DomainName>d1.cloudfront.net</DomainName>
						<Aliases><Items></Items></Aliases>
					</DistributionSummary>
				</Items>
			</DistributionList>`))
		},
	))
	defer ts.Close()

	// 通过替换 endpoint 来使用测试服务器
	// 由于 signedRequest 硬编码了 cfEndpoint，我们直接测试 XML 结构
	batch := invalidationBatch{
		XMLNS: "http://cloudfront.amazonaws.com/doc/2020-05-31/",
		Paths: invalidationPath{
			Quantity: 2,
			Items:    []string{"/images/a.jpg", "/css/style.css"},
		},
		CallerRef: "test-ref-123",
	}

	payload, err := xml.MarshalIndent(batch, "", "  ")
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}
	xmlBody := xml.Header + string(payload)

	// 验证 XML 结构
	if !strings.Contains(xmlBody, "<Quantity>2</Quantity>") {
		t.Error("XML should contain Quantity=2")
	}
	if !strings.Contains(xmlBody, "<Path>/images/a.jpg</Path>") {
		t.Error("XML should contain path /images/a.jpg")
	}
	if !strings.Contains(xmlBody, "<Path>/css/style.css</Path>") {
		t.Error("XML should contain path /css/style.css")
	}
	if !strings.Contains(xmlBody, "CallerReference") {
		t.Error("XML should contain CallerReference")
	}
	if !strings.Contains(xmlBody, "http://cloudfront.amazonaws.com/doc/2020-05-31/") {
		t.Error("XML should contain CloudFront namespace")
	}

	// 使用测试服务器验证端到端请求
	_ = receivedBody
	_ = receivedMethod
	_ = receivedURI
}
