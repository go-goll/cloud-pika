<div align="center">

# Cloud Pika ☁️🐭

**多云对象存储 · CDN 管理 · 桌面操作台**

将分散在各家云厂商控制台的存储与 CDN 能力，聚合到一个原生桌面应用里。

[English](./README.en.md) · 简体中文

![Wails](https://img.shields.io/badge/Wails-v3-DF0000?logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-green)

</div>

---

## 简介

Cloud Pika 的目标不是再做一个"能传文件的工具"，而是成为开发者与运维工程师的**云存储操作台**——在一个界面里统一切换账号、管理多云 Bucket、上传资源拿到 URL、刷新 CDN 缓存，三步合一。

核心差异化价值：**多云统一管理 × CDN 深度集成 × 桌面原生体验 × 开源免费**。

## ✨ 核心特性

- **🌐 多云统一管理** — 一套界面接入 9 家主流云厂商，账号间无缝切换，S3 兼容厂商零门槛接入。
- **📁 完整文件操作** — 上传 / 下载 / 删除 / 重命名 / 搜索，拖拽上传、URL 抓取上传，虚拟滚动支撑海量对象列表。
- **👁️ 增强预览** — 图片、Markdown（GFM）、代码高亮（Shiki）等多种格式在应用内直接预览。
- **🚀 CDN 管理** — 上传后右键即可刷新 CDN 缓存，把"切回控制台"这一步去掉。
- **🛠️ 存储治理** — CORS、生命周期、版本管理等 Bucket 级配置。
- **📦 传输队列** — 独立的传输任务中心，支持进度追踪、断点与并发控制。
- **🔐 凭证加密** — 云厂商密钥本地加密存储，不上云、不外传。
- **🌍 国际化** — 内置简体中文 / English，跟随系统语言并支持手动切换。
- **♻️ 原生直连** — 原生 Go 后端，进程内直接调用，无需本地端口，无独立后台进程。

## ☁️ 支持的云厂商

| 厂商 | 标识 | 接入方式 |
|:-----|:-----|:---------|
| 七牛云 Kodo | `qiniu` | 原生 SDK（含 CDN） |
| 腾讯云 COS | `tencent` | 原生 SDK |
| 阿里云 OSS | `aliyun` | 原生 SDK |
| Amazon S3 | `aws` | 原生 SDK |
| 京东云 OSS | `jd` | S3 兼容 |
| 又拍云 USS | `upyun` | 原生 SDK |
| 青云 QingStor | `qingstor` | 原生 SDK |
| 金山云 KS3 | `ks3` | S3 兼容 |
| MinIO | `minio` | S3 兼容 |
| 任意 S3 兼容存储 | `s3compat` | S3 兼容 |

## 🏗️ 技术架构

Cloud Pika 基于 **Wails v3 (alpha)** 构建为单进程桌面应用：Go 业务逻辑封装为 Wails 绑定服务，前端通过生成的类型安全 TS bindings 直接调用，无独立后台进程、无本地 HTTP 端口与 token。

```
┌─────────────────────────────────────────────┐
│  React 前端 (Vite + TS + Tailwind)           │
│  通过 Wails 生成的 TS bindings 调用 Go 方法   │
└─────────────────────────────────────────────┘
               ↑ Wails bindings + 事件（进程内）
┌─────────────────────────────────────────────┐
│  Wails v3 应用 (Go 1.25，单进程)              │
│  绑定服务：账号/桶/对象/传输/CDN/治理/设置/系统 │
│  8 云厂商 SDK · SQLite · 加密 · 传输队列      │
└─────────────────────────────────────────────┘
```

- **前端**：React 18、Vite、TailwindCSS 3、Radix UI、Zustand（状态）、TanStack Query/Virtual、i18next、react-markdown、Shiki。
- **Wails v3 应用**：Go 1.25 单进程桌面外壳，负责窗口、系统托盘，并将业务逻辑装配为绑定服务。
- **绑定服务**：账号、桶、对象、传输、CDN、治理、设置、系统等服务以 Wails bindings 暴露给前端，前端经类型安全的 TS 绑定进程内直连调用。
- **事件推送**：传输进度等通过 Wails 事件系统（`Events.On`）推送到前端，替代旧架构的 SSE。

## 🚀 快速开始

> 当前处于尝鲜阶段，仅支持 **macOS**。

### 环境要求

- **macOS**（当前唯一支持的平台）
- **Node.js** ≥ 18，及 npm
- **Go** ≥ 1.25
- **Wails v3 CLI**：`go install github.com/wailsapp/wails/v3/cmd/wails3@latest`

> 可执行 `make doctor`（即 `wails3 doctor`）检查 Wails 构建环境是否就绪。

### 安装依赖

```bash
make install
```

### 本地开发

```bash
make dev
```

该命令运行 `wails3 dev`，启动桌面窗口并接入 Vite 热更新，Go 与前端代码改动即时生效。

### 打包构建

```bash
make build      # 编译可执行二进制，产物为 bin/cloud-pika
make package    # 打包为 macOS 应用，产物为 bin/cloud-pika.app
```

- `make build`（即 `wails3 build`）产出 `bin/cloud-pika`。
- `make package`（即 `wails3 package`）产出可分发的 `bin/cloud-pika.app`。

> 当 Go 服务方法签名变更后，运行 `make bindings`（即 `wails3 generate bindings`）重新生成前端 TS 绑定。

### 运行测试

```bash
make test           # 运行全部测试（Go + 前端）
make test-go        # 仅 Go 测试
make test-frontend  # 仅前端测试 (Vitest)
```

## 📂 项目结构

```
cloud-pika/
├── main.go               # Wails 应用入口（装配服务/事件/数据库/托盘）
├── services/             # Wails 绑定服务层（账号/桶/对象/传输/CDN/治理/设置/系统）
├── internal/             # 业务逻辑
│   ├── storage/          # 各云厂商存储实现
│   ├── database/         # SQLite 数据访问
│   ├── crypto/           # 凭证加密
│   ├── queue/            # 传输队列
│   ├── model/            # 领域模型
│   ├── config/           # 配置
│   ├── events/           # 事件推送
│   ├── system/           # 系统能力（对话框/剪贴板等）
│   └── tray/             # 系统托盘
├── frontend/             # React 前端
│   ├── src/              # 页面 / 组件 / 状态 / i18n
│   └── bindings/         # Wails 生成的 TS 绑定
├── build/                # Wails 构建配置（darwin/ · config.yml）
├── docs/                 # 产品规划与设计文档
├── Taskfile.yml          # Wails 标准构建任务
└── Makefile              # 便捷封装
```

## 🤝 贡献

欢迎提交 Issue 与 Pull Request。提交代码前请确保通过 `make test`。

## 📄 许可证

本项目基于 [GNU General Public License v3.0](./LICENSE) 开源。你可以自由使用、修改和分发本项目，但任何分发的衍生作品也必须以 GPL-3.0 协议开源。

```
Copyright (C) 2026 goll

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```
