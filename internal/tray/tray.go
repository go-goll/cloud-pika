// Package tray 提供 Cloud Pika 的系统托盘，迁移自原 Tauri 版本的 tray.rs。
// 托盘菜单包含「显示窗口」「上传文件」「退出」三项，图标使用 macOS 模板
// 图标以自动适配深浅色主题。
package tray

import (
	_ "embed"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// EventTrayUpload 是点击「上传文件」时发射的事件名，前端监听后驱动上传流程，
// 替代原 Tauri 的 tray-upload-select / tray-upload-files 链路。
const EventTrayUpload = "tray.upload"

// trayIcon 是嵌入的托盘图标（22x22 @2x，RGBA PNG），作为 macOS 模板图标使用。
//
//go:embed icon.png
var trayIcon []byte

// Setup 创建并装配系统托盘，由 main.go 在应用启动后调用。
// 它设置模板图标、构建中文菜单，并把菜单项绑定到对应行为。
func Setup(app *application.App) {
	tray := app.SystemTray.New()
	tray.SetTemplateIcon(trayIcon)
	tray.SetTooltip("Cloud Pika")

	menu := application.NewMenu()

	menu.Add("显示 Cloud Pika").OnClick(func(*application.Context) {
		showMainWindow(app)
	})
	menu.Add("上传文件…").OnClick(func(*application.Context) {
		app.Event.Emit(EventTrayUpload, nil)
	})
	menu.AddSeparator()
	menu.Add("退出").OnClick(func(*application.Context) {
		app.Quit()
	})

	tray.SetMenu(menu)
}

// showMainWindow 显示并聚焦主窗口；若无当前窗口则尝试取第一个已注册窗口。
func showMainWindow(app *application.App) {
	window := app.Window.Current()
	if window == nil {
		if all := app.Window.GetAll(); len(all) > 0 {
			window = all[0]
		}
	}
	if window == nil {
		return
	}
	window.Show()
	window.Focus()
}
