# Cloud Pika — Wails v3 构建入口
# 实际任务定义在 Taskfile.yml（Wails 标准）；此 Makefile 仅做便捷封装。
# 需先安装 Wails v3 CLI：
#   go install github.com/wailsapp/wails/v3/cmd/wails3@latest

.PHONY: install dev build package test test-go test-frontend bindings doctor

# 安装前端依赖
install:
	cd frontend && npm install

# 开发模式（热重载，启动桌面窗口 + Vite 开发服务器）
dev:
	wails3 dev -config ./build/config.yml

# 构建可执行二进制（bin/cloud-pika）
build:
	wails3 build

# 打包为 macOS .app（bin/cloud-pika.app）
package:
	wails3 package

# 重新生成前端 TS bindings
bindings:
	wails3 generate bindings -ts -clean=true

# 运行全部测试（Go + 前端）
test: test-go test-frontend

test-go:
	go test ./...

test-frontend:
	cd frontend && npm run test:run

# 检查 Wails 构建环境
doctor:
	wails3 doctor
