package services

import (
	"errors"

	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/model"
)

// TransferService 暴露传输任务管理能力给前端绑定。
type TransferService struct {
	deps *core.Deps
}

// NewTransferService 基于共享依赖构建传输服务。
func NewTransferService(deps *core.Deps) *TransferService {
	return &TransferService{deps: deps}
}

// List 返回所有传输任务。
func (s *TransferService) List() ([]model.TransferTask, error) {
	return s.deps.Queue.List()
}

// Cancel 取消指定传输任务。
func (s *TransferService) Cancel(id string) error {
	if id == "" {
		return errors.New("transfer id required")
	}
	s.deps.Queue.Cancel(id)
	return nil
}
