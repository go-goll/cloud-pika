package system

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"golang.design/x/clipboard"
)

// ErrNoClipboardImage 表示剪贴板中没有图片。
var ErrNoClipboardImage = errors.New("clipboard image not found")

var clipboardInitErr = clipboard.Init()

// ReadClipboardImageToTemp 读取剪贴板 PNG 图片并存为临时文件，返回路径。
func ReadClipboardImageToTemp(tempDir string, nowUnixMilli int64) (string, error) {
	if clipboardInitErr != nil {
		return "", fmt.Errorf("clipboard init failed: %w", clipboardInitErr)
	}
	data := clipboard.Read(clipboard.FmtImage)
	if len(data) == 0 {
		return "", ErrNoClipboardImage
	}
	return writeImageToTemp(tempDir, nowUnixMilli, data)
}

// writeImageToTemp 把图片字节写入临时目录下的 PNG 文件，返回路径。
func writeImageToTemp(dir string, ts int64, data []byte) (string, error) {
	path := filepath.Join(dir, fmt.Sprintf("cloud-pika-clipboard-%d.png", ts))
	if err := os.WriteFile(path, data, 0o600); err != nil {
		return "", err
	}
	return path, nil
}
