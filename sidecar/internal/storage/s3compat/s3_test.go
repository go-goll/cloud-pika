package s3compat

import (
	"context"
	"testing"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

func TestGenerateURLFallback(t *testing.T) {
	provider := New("aws", []string{"paging"}, Options{})

	url, err := provider.GenerateURL(model.SignedURLParams{
		Key:    "abc/file.png",
		Domain: "cdn.example.com",
		HTTPS:  true,
	})
	if err != nil {
		t.Fatalf("generate url failed: %v", err)
	}
	if url != "https://cdn.example.com/abc/file.png" {
		t.Fatalf("unexpected url: %s", url)
	}
}

func TestProgressReader(t *testing.T) {
	var reported []int
	pr := &progressReader{
		total: 100,
		callback: func(pct int) {
			reported = append(reported, pct)
		},
	}

	// 模拟分 4 次写入共 100 字节
	for i := 0; i < 4; i++ {
		n, err := pr.Read(make([]byte, 25))
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if n != 25 {
			t.Fatalf("expected 25, got %d", n)
		}
	}

	// 应该产生 25, 50, 75, 99 四次回调（99 因为 cap 在 99）
	expected := []int{25, 50, 75, 99}
	if len(reported) != len(expected) {
		t.Fatalf(
			"expected %d callbacks, got %d: %v",
			len(expected), len(reported), reported,
		)
	}
	for i, v := range expected {
		if reported[i] != v {
			t.Errorf(
				"callback[%d]: expected %d, got %d",
				i, v, reported[i],
			)
		}
	}
}

func TestProgressReader_NoDuplicate(t *testing.T) {
	var reported []int
	pr := &progressReader{
		total: 1000,
		callback: func(pct int) {
			reported = append(reported, pct)
		},
	}

	// 写入 10 次各 1 字节 (总 1000)，百分比都是 0%，不应产生回调
	for i := 0; i < 10; i++ {
		pr.Read(make([]byte, 1))
	}
	if len(reported) != 1 {
		t.Errorf(
			"expected 1 callback for 1%%, got %d: %v",
			len(reported), reported,
		)
	}
}

func TestUploadObject_NilClient(t *testing.T) {
	p := New("test", nil, Options{})
	err := p.UploadObject(context.Background(), model.UploadParams{
		Bucket:    "b",
		Key:       "k",
		LocalPath: "/nonexistent",
	})
	if err == nil {
		t.Fatal("expected error for nil client")
	}
}

func TestUploadObject_MissingParams(t *testing.T) {
	p := New("test", nil, Options{})
	// 通过 Init 无法成功（无 endpoint），手动测试参数校验
	err := p.UploadObject(context.Background(), model.UploadParams{})
	if err == nil {
		t.Fatal("expected error for nil client")
	}
}
