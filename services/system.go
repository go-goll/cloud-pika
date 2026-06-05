package services

import (
	"os"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"

	"github.com/goll/cloud-pika/internal/system"
)

// SystemService 暴露原生系统能力（对话框、剪贴板、剪贴板图片）。
type SystemService struct {
	app *application.App
}

// NewSystemService 基于 Wails 应用构建系统服务。
func NewSystemService(app *application.App) *SystemService {
	return &SystemService{app: app}
}

// OpenFileDialog 打开多选文件对话框，返回选中路径。
func (s *SystemService) OpenFileDialog() ([]string, error) {
	return s.app.Dialog.OpenFile().CanChooseFiles(true).PromptForMultipleSelection()
}

// OpenFolderDialog 打开文件夹选择对话框，返回选中目录（单元素切片）。
func (s *SystemService) OpenFolderDialog() ([]string, error) {
	path, err := s.app.Dialog.OpenFile().
		CanChooseDirectories(true).CanChooseFiles(false).PromptForSingleSelection()
	if err != nil || path == "" {
		return []string{}, err
	}
	return []string{path}, nil
}

// WriteClipboardText 写入文本到剪贴板。
func (s *SystemService) WriteClipboardText(text string) error {
	s.app.Clipboard.SetText(text)
	return nil
}

// ReadClipboardImage 读取剪贴板图片存临时 PNG，返回路径。
func (s *SystemService) ReadClipboardImage() (string, error) {
	return system.ReadClipboardImageToTemp(os.TempDir(), time.Now().UnixMilli())
}
