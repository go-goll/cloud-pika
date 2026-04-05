package storage

import (
	"fmt"

	"github.com/goll/cloud-pika/sidecar/internal/storage/ali"
	"github.com/goll/cloud-pika/sidecar/internal/storage/aws"
	"github.com/goll/cloud-pika/sidecar/internal/storage/jd"
	"github.com/goll/cloud-pika/sidecar/internal/storage/ks3"
	"github.com/goll/cloud-pika/sidecar/internal/storage/minio"
	"github.com/goll/cloud-pika/sidecar/internal/storage/qingstor"
	"github.com/goll/cloud-pika/sidecar/internal/storage/qiniu"
	"github.com/goll/cloud-pika/sidecar/internal/storage/tencent"
	"github.com/goll/cloud-pika/sidecar/internal/storage/upyun"
)

// Factory 根据 provider 名称构造实例。
type Factory struct{}

func NewFactory() Factory {
	return Factory{}
}

func (f Factory) Create(provider string) (Provider, error) {
	switch provider {
	case "qiniu":
		return qiniu.New(), nil
	case "tencent":
		return tencent.New(), nil
	case "aliyun":
		return ali.New(), nil
	case "aws":
		return aws.New(), nil
	case "qingstor":
		return qingstor.New(), nil
	case "jd":
		return jd.New(), nil
	case "upyun":
		return upyun.New(), nil
	case "minio":
		return minio.New(), nil
	case "ks3":
		return ks3.New(), nil
	default:
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}
}
