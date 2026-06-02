<div align="center">

# Cloud Pika ☁️🐭

**多云对象存储 · CDN 管理 · 桌面操作台**

将分散在各家云厂商控制台的存储与 CDN 能力，聚合到一个原生桌面应用里。

[English](./README.en.md) · 简体中文

![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/Go-1.23-00ADD8?logo=go&logoColor=white)
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
- **♻️ 稳定可靠** — Sidecar 崩溃自愈、SSE 断线自动重连。

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

Cloud Pika 采用 **Tauri 前端 + Go Sidecar** 的混合架构，兼顾原生桌面体验与后端生态的丰富 SDK：

```
┌──────────────────────────────────────────────┐
│  前端 UI  (React 18 + TypeScript + Tailwind)   │
│  Radix UI · Zustand · TanStack Query/Virtual   │
└───────────────────────┬──────────────────────┘
                        │ Tauri IPC
┌───────────────────────┴──────────────────────┐
│  桌面外壳  (Tauri 2 / Rust)                     │
│  窗口管理 · 系统托盘 · Sidecar 生命周期         │
└───────────────────────┬──────────────────────┘
                        │ HTTP + SSE (localhost)
┌───────────────────────┴──────────────────────┐
│  Sidecar  (Go 1.23)                            │
│  各云厂商 SDK · 传输队列 · 凭证加密 · 本地存储  │
└──────────────────────────────────────────────┘
```

- **前端**：React 18、Vite 6、TailwindCSS 3、Radix UI、Zustand（状态）、TanStack Query/Virtual、i18next、react-markdown、Shiki。
- **桌面外壳**：Tauri 2（Rust），负责窗口、系统托盘，并托管 Go Sidecar 进程。
- **Sidecar**：Go 1.23 编写的本地 HTTP 服务，封装各云厂商 SDK，通过 SSE 向前端推送传输进度等事件。

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 18，及 npm / pnpm / yarn 任一包管理器
- **Go** ≥ 1.23（编译 Sidecar）
- **Rust** 工具链（Tauri 2 要求，见 [Tauri 环境配置](https://v2.tauri.app/start/prerequisites/)）

### 安装依赖

```bash
make install
```

### 本地开发

```bash
make dev
```

该命令会先编译 Go Sidecar，再启动 Tauri 开发窗口（前端热更新）。

### 打包构建

```bash
make build
```

构建完成后，安装包产出在 `src-tauri/target/release/bundle/` 下：

- **macOS**：`bundle/dmg/cloud-pika_<版本>_<架构>.dmg`（推荐分发）及 `bundle/macos/cloud-pika.app`
- **Windows**：先执行 `make sidecar-build-windows` 准备 Sidecar，再在 Windows 上 `make build`，产物为 `.msi` / `.exe`

> 提示：`make build` 默认编译当前机器架构。Apple Silicon 构建出的包（`aarch64`）无法在 Intel Mac 上运行，反之亦然。

### 运行测试

```bash
make sidecar-test   # Go Sidecar 单元测试
npm run test        # 前端测试 (Vitest)
```

## 📂 项目结构

```
cloud-pika/
├── src/                  # 前端 React 应用
│   ├── pages/            # 页面：登录 / Bucket / 传输 / 设置
│   ├── components/       # UI 组件
│   ├── stores/           # Zustand 状态
│   ├── i18n/             # 国际化资源（zh-CN / en）
│   └── lib/              # 工具与 API 封装
├── src-tauri/            # Tauri 桌面外壳 (Rust)
│   ├── src/commands/     # Tauri 命令
│   └── tauri.conf.json   # 应用与打包配置
├── sidecar/              # Go Sidecar 后端
│   ├── cmd/              # 入口
│   └── internal/
│       ├── storage/      # 各云厂商存储实现
│       ├── handler/      # HTTP 路由处理
│       ├── crypto/       # 凭证加密
│       └── queue/        # 传输队列
├── docs/                 # 产品规划与设计文档
└── Makefile              # 构建入口
```

## 🤝 贡献

欢迎提交 Issue 与 Pull Request。提交代码前请确保通过 `make sidecar-test` 与前端测试。

## 📄 许可证

本项目基于 [GNU General Public License v3.0](./LICENSE) 开源。你可以自由使用、修改和分发本项目，但任何分发的衍生作品也必须以 GPL-3.0 协议开源。

```
Copyright (C) 2026 goll

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```
