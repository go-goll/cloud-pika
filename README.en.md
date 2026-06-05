<div align="center">

# Cloud Pika ☁️🐭

**Multi-Cloud Object Storage · CDN Management · Desktop Console**

Bring the storage and CDN capabilities scattered across every cloud vendor's console into one native desktop app.

English · [简体中文](./README.md)

![Wails](https://img.shields.io/badge/Wails-v3-DF0000?logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)
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
- **♻️ Native & direct** — A native Go backend called in-process, with no local ports and no separate background process.

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

Cloud Pika is a single-process desktop app built on **Wails v3 (alpha)**. The Go business logic is exposed as Wails binding services, which the frontend calls directly through generated, type-safe TS bindings — with no separate background process and no local HTTP port or token.

```
┌─────────────────────────────────────────────┐
│  React frontend (Vite + TS + Tailwind)       │
│  Calls Go methods via generated TS bindings   │
└─────────────────────────────────────────────┘
            ↑ Wails bindings + events (in-process)
┌─────────────────────────────────────────────┐
│  Wails v3 app (Go 1.25, single process)      │
│  Services: account/bucket/object/transfer/    │
│            CDN/governance/settings/system     │
│  8 vendor SDKs · SQLite · crypto · queue      │
└─────────────────────────────────────────────┘
```

- **Frontend**: React 18, Vite, TailwindCSS 3, Radix UI, Zustand, TanStack Query/Virtual, i18next, react-markdown, Shiki.
- **Wails v3 app**: A single-process Go 1.25 desktop shell that handles windowing and the system tray, and wires the business logic up as binding services.
- **Binding services**: Account, bucket, object, transfer, CDN, governance, settings, and system services are exposed as Wails bindings and invoked in-process by the frontend through type-safe TS bindings.
- **Events**: Transfer progress and similar updates are pushed to the frontend via the Wails event system (`Events.On`), replacing the old SSE channel.

## 🚀 Getting Started

> This is an early-access stage and **macOS only** for now.

### Prerequisites

- **macOS** (the only supported platform for now)
- **Node.js** ≥ 18, with npm
- **Go** ≥ 1.25
- **Wails v3 CLI**: `go install github.com/wailsapp/wails/v3/cmd/wails3@latest`

> Run `make doctor` (i.e. `wails3 doctor`) to check that the Wails build environment is ready.

### Install

```bash
make install
```

### Develop

```bash
make dev
```

This runs `wails3 dev`, launching the desktop window with Vite hot-reload — changes to both Go and frontend code take effect immediately.

### Build

```bash
make build      # compile the executable binary, output: bin/cloud-pika
make package    # package the macOS app, output: bin/cloud-pika.app
```

- `make build` (i.e. `wails3 build`) produces `bin/cloud-pika`.
- `make package` (i.e. `wails3 package`) produces the distributable `bin/cloud-pika.app`.

> After changing a Go service method signature, run `make bindings` (i.e. `wails3 generate bindings`) to regenerate the frontend TS bindings.

### Test

```bash
make test           # run all tests (Go + frontend)
make test-go        # Go tests only
make test-frontend  # frontend tests only (Vitest)
```

## 📂 Project Layout

```
cloud-pika/
├── main.go               # Wails app entry (wires services/events/database/tray)
├── services/             # Wails binding service layer (account/bucket/object/transfer/CDN/governance/settings/system)
├── internal/             # business logic
│   ├── storage/          # per-provider storage impls
│   ├── database/         # SQLite data access
│   ├── crypto/           # credential encryption
│   ├── queue/            # transfer queue
│   ├── model/            # domain models
│   ├── config/           # configuration
│   ├── events/           # event publishing
│   ├── system/           # system capabilities (dialogs/clipboard/etc.)
│   └── tray/             # system tray
├── frontend/             # React frontend
│   ├── src/              # pages / components / state / i18n
│   └── bindings/         # Wails-generated TS bindings
├── build/                # Wails build config (darwin/ · config.yml)
├── docs/                 # product & design docs
├── Taskfile.yml          # standard Wails build tasks
└── Makefile              # convenience wrapper
```

## 🤝 Contributing

Issues and pull requests are welcome. Please make sure `make test` passes before submitting.

## 📄 License

Licensed under the [GNU General Public License v3.0](./LICENSE). You may use, modify, and distribute this project freely, provided that any distributed derivative work is also released under GPL-3.0.

```
Copyright (C) 2026 goll

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```
