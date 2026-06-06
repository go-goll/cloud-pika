package main

import (
	"embed"
	"log"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"

	"github.com/goll/cloud-pika/internal/config"
	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/database"
	"github.com/goll/cloud-pika/internal/events"
	"github.com/goll/cloud-pika/internal/queue"
	"github.com/goll/cloud-pika/internal/tray"
	"github.com/goll/cloud-pika/services"
)

// assets 嵌入前端构建产物，由 Wails 资源服务器提供给 webview。
//
//go:embed all:frontend/dist
var assets embed.FS

func main() {
	db, err := database.Open(resolveDBPath())
	if err != nil {
		log.Fatalf("open database failed: %v", err)
	}
	defer db.Close()
	if err = database.Migrate(db); err != nil {
		log.Fatalf("run migration failed: %v", err)
	}

	app := application.New(application.Options{
		Name:        "Cloud Pika",
		Description: "多云对象存储管理客户端",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// 事件 publisher 复用 queue 已有的 publisher 接口，把传输进度转发到前端。
	queueMgr := queue.NewManager(db, events.NewWailsPublisher(app.Event))
	deps := core.NewDeps(config.Config{MasterKey: resolveMasterKey()}, db, queueMgr)

	app.RegisterService(application.NewService(services.NewAccountService(deps)))
	app.RegisterService(application.NewService(services.NewBucketService(deps)))
	app.RegisterService(application.NewService(services.NewObjectService(deps)))
	app.RegisterService(application.NewService(services.NewTransferService(deps)))
	app.RegisterService(application.NewService(services.NewCDNService(deps)))
	app.RegisterService(application.NewService(services.NewGovernanceService(deps)))
	app.RegisterService(application.NewService(services.NewSettingsService(deps)))
	app.RegisterService(application.NewService(services.NewSystemService(app)))

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:     "Cloud Pika",
		Width:     1280,
		Height:    820,
		MinWidth:  960,
		MinHeight: 680,
		Frameless: true,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropNormal, // 不透明画布，工作台不使用毛玻璃
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		URL: "/",
	})
	tray.Setup(app)

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}

// resolveDBPath 返回 macOS 应用数据目录下的 SQLite 路径。
func resolveDBPath() string {
	dir, err := os.UserConfigDir() // macOS: ~/Library/Application Support
	if err != nil {
		dir = os.TempDir()
	}
	appDir := filepath.Join(dir, "cloud-pika")
	_ = os.MkdirAll(appDir, 0o755)
	return filepath.Join(appDir, "cloud-pika.sqlite")
}

// resolveMasterKey 读取密钥加密主密钥，环境变量优先，否则用默认值。
func resolveMasterKey() string {
	if key := os.Getenv("CLOUD_PIKA_MASTER_KEY"); key != "" {
		return key
	}
	return "cloud-pika-default-master-key"
}
