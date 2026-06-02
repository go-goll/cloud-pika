<div align="center">

# Cloud Pika ☁️🐭

**Multi-Cloud Object Storage · CDN Management · Desktop Console**

Bring the storage and CDN capabilities scattered across every cloud vendor's console into one native desktop app.

English · [简体中文](./README.md)

![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/Go-1.23-00ADD8?logo=go&logoColor=white)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-green)

</div>

---

## Overview

Cloud Pika isn't yet another "tool that uploads files." It aims to be a **cloud storage console** for developers and DevOps engineers — switch accounts, manage buckets across clouds, upload an asset and grab its URL, then purge the CDN cache, all in one place.

Its differentiation: **unified multi-cloud management × deep CDN integration × native desktop experience × free & open source**.

## ✨ Features

- **🌐 Unified multi-cloud** — One UI for 9 major cloud vendors, seamless account switching, and zero-friction onboarding for any S3-compatible provider.
- **📁 Full file operations** — Upload / download / delete / rename / search, with drag-and-drop and fetch-from-URL uploads; virtualized lists handle huge object counts.
- **👁️ Rich preview** — Preview images, Markdown (GFM), and syntax-highlighted code (Shiki) right inside the app.
- **🚀 CDN management** — Right-click to purge the CDN cache after uploading — no more switching back to the console.
- **🛠️ Storage governance** — Bucket-level configuration: CORS, lifecycle, and versioning.
- **📦 Transfer queue** — A dedicated transfer center with progress tracking and concurrency control.
- **🔐 Encrypted credentials** — Vendor keys are encrypted and stored locally — never uploaded, never shared.
- **🌍 i18n** — Built-in Simplified Chinese / English, follows the system locale and can be switched manually.
- **♻️ Resilient** — Sidecar crash self-recovery and automatic SSE reconnection.

## ☁️ Supported Providers

| Provider | ID | Integration |
|:---------|:---|:------------|
| Qiniu Kodo | `qiniu` | Native SDK (incl. CDN) |
| Tencent Cloud COS | `tencent` | Native SDK |
| Alibaba Cloud OSS | `aliyun` | Native SDK |
| Amazon S3 | `aws` | Native SDK |
| JD Cloud OSS | `jd` | S3-compatible |
| Upyun USS | `upyun` | Native SDK |
| QingStor | `qingstor` | Native SDK |
| Kingsoft KS3 | `ks3` | S3-compatible |
| MinIO | `minio` | S3-compatible |
| Any S3-compatible store | `s3compat` | S3-compatible |

## 🏗️ Architecture

Cloud Pika combines a **Tauri frontend with a Go sidecar**, getting both a native desktop experience and the rich SDK ecosystem of the backend:

```
┌──────────────────────────────────────────────┐
│  Frontend UI  (React 18 + TypeScript + Tailwind) │
│  Radix UI · Zustand · TanStack Query/Virtual    │
└───────────────────────┬──────────────────────┘
                        │ Tauri IPC
┌───────────────────────┴──────────────────────┐
│  Desktop shell  (Tauri 2 / Rust)               │
│  Windowing · system tray · sidecar lifecycle   │
└───────────────────────┬──────────────────────┘
                        │ HTTP + SSE (localhost)
┌───────────────────────┴──────────────────────┐
│  Sidecar  (Go 1.23)                            │
│  Vendor SDKs · transfer queue · crypto · store │
└──────────────────────────────────────────────┘
```

- **Frontend**: React 18, Vite 6, TailwindCSS 3, Radix UI, Zustand, TanStack Query/Virtual, i18next, react-markdown, Shiki.
- **Desktop shell**: Tauri 2 (Rust) — handles windowing and the system tray, and supervises the Go sidecar process.
- **Sidecar**: A local HTTP service in Go 1.23 that wraps vendor SDKs and pushes events (e.g. transfer progress) to the frontend over SSE.

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18, with npm / pnpm / yarn
- **Go** ≥ 1.23 (to build the sidecar)
- **Rust** toolchain (required by Tauri 2 — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

### Install

```bash
make install
```

### Develop

```bash
make dev
```

This builds the Go sidecar first, then launches the Tauri dev window with frontend hot-reload.

### Build

```bash
make build
```

Bundles are produced under `src-tauri/target/release/bundle/`:

- **macOS**: `bundle/dmg/cloud-pika_<version>_<arch>.dmg` (recommended for distribution) and `bundle/macos/cloud-pika.app`
- **Windows**: run `make sidecar-build-windows` to prepare the sidecar, then `make build` on Windows to get the `.msi` / `.exe`

> Note: `make build` targets the host architecture. An Apple Silicon build (`aarch64`) won't run on Intel Macs, and vice versa.

### Test

```bash
make sidecar-test   # Go sidecar unit tests
npm run test        # frontend tests (Vitest)
```

## 📂 Project Layout

```
cloud-pika/
├── src/                  # React frontend
│   ├── pages/            # Login / Bucket / Transfers / Settings
│   ├── components/       # UI components
│   ├── stores/           # Zustand state
│   ├── i18n/             # i18n resources (zh-CN / en)
│   └── lib/              # utilities & API client
├── src-tauri/            # Tauri desktop shell (Rust)
│   ├── src/commands/     # Tauri commands
│   └── tauri.conf.json   # app & bundle config
├── sidecar/              # Go sidecar backend
│   ├── cmd/              # entrypoint
│   └── internal/
│       ├── storage/      # per-provider storage impls
│       ├── handler/      # HTTP route handlers
│       ├── crypto/       # credential encryption
│       └── queue/        # transfer queue
├── docs/                 # product & design docs
└── Makefile              # build entrypoint
```

## 🤝 Contributing

Issues and pull requests are welcome. Please make sure `make sidecar-test` and the frontend tests pass before submitting.

## 📄 License

Licensed under the [GNU General Public License v3.0](./LICENSE). You may use, modify, and distribute this project freely, provided that any distributed derivative work is also released under GPL-3.0.

```
Copyright (C) 2026 goll

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```
