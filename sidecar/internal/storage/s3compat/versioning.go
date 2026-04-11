package s3compat

import (
	"context"
	"fmt"

	"github.com/minio/minio-go/v7"

	"github.com/goll/cloud-pika/sidecar/internal/model"
)

// GetVersioning 获取 Bucket 版本控制状态。
// 返回 "Enabled"、"Suspended" 或 ""（未启用）。
func (p *Provider) GetVersioning(ctx context.Context, bucket string) (string, error) {
	cfg, err := p.client.GetBucketVersioning(ctx, bucket)
	if err != nil {
		return "", fmt.Errorf("get versioning failed: %w", err)
	}
	return cfg.Status, nil
}

// PutVersioning 设置 Bucket 版本控制状态。
func (p *Provider) PutVersioning(ctx context.Context, bucket string, enabled bool) error {
	cfg := minio.BucketVersioningConfiguration{
		Status: "Suspended",
	}
	if enabled {
		cfg.Status = "Enabled"
	}
	if err := p.client.SetBucketVersioning(ctx, bucket, cfg); err != nil {
		return fmt.Errorf("put versioning failed: %w", err)
	}
	return nil
}

// ListObjectVersions 列出对象版本历史（带分页限制）。
func (p *Provider) ListObjectVersions(ctx context.Context, params model.VersionListParams) (*model.VersionList, error) {
	limit := params.Limit
	if limit <= 0 {
		limit = 100
	}

	opts := minio.ListObjectsOptions{
		Prefix:       params.Prefix,
		WithVersions: true,
	}
	if params.KeyMarker != "" {
		opts.StartAfter = params.KeyMarker
	}

	result := &model.VersionList{}
	count := 0
	for obj := range p.client.ListObjects(ctx, params.Bucket, opts) {
		if obj.Err != nil {
			return nil, fmt.Errorf("list versions failed: %w", obj.Err)
		}
		if obj.IsDeleteMarker {
			result.DeleteMarkers = append(result.DeleteMarkers, model.DeleteMarker{
				Key:          obj.Key,
				VersionID:    obj.VersionID,
				IsLatest:     obj.IsLatest,
				LastModified: obj.LastModified.Format("2006-01-02T15:04:05Z"),
			})
		} else {
			result.Versions = append(result.Versions, model.ObjectVersion{
				Key:          obj.Key,
				VersionID:    obj.VersionID,
				IsLatest:     obj.IsLatest,
				Size:         obj.Size,
				LastModified: obj.LastModified.Format("2006-01-02T15:04:05Z"),
				StorageClass: obj.StorageClass,
			})
		}
		count++
		if count >= limit {
			result.Truncated = true
			if len(result.Versions) > 0 {
				last := result.Versions[len(result.Versions)-1]
				result.NextKeyMarker = last.Key
				result.NextVersionMarker = last.VersionID
			}
			break
		}
	}
	return result, nil
}
