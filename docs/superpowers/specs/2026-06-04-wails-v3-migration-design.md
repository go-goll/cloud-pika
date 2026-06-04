# Tauri → Wails v3 彻底原生迁移设计

- **状态**：已评审通过，待 writing-plans 拆解实现计划
- **日期**：2026-06-04
- **定位**：Go Wails v3 尝鲜 + 为后续项目积累迁移范式
- **范围**：仅本子项目（架构迁移）。UI 全面升级为**后续独立子项目**，迁移跑通后单独立项。

## 1. 背景与目标

### 当前架构

```
Tauri (Rust 外壳, ~400 行)
  ├─ sidecar 进程管理（spawn/restart/健康检查，随机端口 + token）
  ├─ 系统能力：文件/文件夹对话框、剪贴板读写、剪贴板图片
  └─ 系统托盘 tray.rs
        ↓ 启动独立进程
Go sidecar (Gin HTTP + SSE)
  ├─ 8 个云存储 provider（s3compat/qiniu/tencent/aws/minio/upyun/ks3/qingstor）
  └─ SQLite、加密、传输队列、CDN、桶治理
        ↓ HTTP(axios) + SSE(EventSource)，Bearer token
React/Vite 前端（Cirrus Ether 设计系统）
```

**关键洞察**：业务逻辑早已是纯 Go（sidecar），Rust 只是薄外壳。迁移本质是「换外壳 + 改通信层」，业务逻辑可零改动复用。

### 目标

把 Tauri(Rust) 外壳替换为 Wails v3，**彻底原生**：Go handler 暴露为 Wails 绑定服务，前端用生成的类型安全 TS 绑定调用，SSE 改用 Wails 事件，去掉本地 HTTP 端口 / token / axios。

### 已确认的关键决策

| 决策点 | 选择 |
|:---|:---|
| 迁移彻底程度 | 彻底原生（binding + events，去掉 HTTP） |
| 执行顺序 | 先迁移，后 UI 升级 |
| 目标平台 | 仅 macOS（尝鲜阶段） |
| HTTP/浏览器开发通道 | 完全去掉 |

### 成熟度前提

Wails v3 截至 2026-06 仍为 **alpha**（最新 `v3.0.0-alpha.98`），官方表述 API 相对稳定、已有生产应用、正推进 Beta。作为尝鲜 + 内部范式验证可接受，但需锁定具体 alpha 版本号，接受 API 仍可能微调。

## 2. 迁移后总体架构

```
Wails v3 应用（单一 Go 进程）
  application.New(){
    Services: [
      AccountService, BucketService, ObjectService, TransferService,
      CDNService, GovernanceService, SettingsService, SystemService
    ]
  }
  ├─ 直接 import 原 sidecar 的 storage/database/crypto/queue 包（零改动复用）
  ├─ 传输进度通过 app.Event.Emit() 推送（替代 SSE）
  └─ SQLite 路径用 Wails 的 app data 目录
        ↓ Wails 生成的类型安全 TS bindings + Events.On
React/Vite 前端（视觉层暂不动）
  ├─ 删除 axios / api-client.ts / token / SSE
  ├─ 改用 @wailsio/runtime + 生成的 bindings
  └─ 删除 isTauriEnv fallback

删除：src-tauri/ 整个目录、Gin router/server/middleware、
     独立 sidecar 进程、token 鉴权、HTTP/SSE 层
```

## 3. 项目结构 / Go module 组织

把根目录提升为 Wails 主 module，sidecar 的 `internal/*` 包并入主 module 复用。

```
cloud-pika/
├── main.go               # Wails 入口（替代 src-tauri/src/main.rs）
├── go.mod                # 主 module，import 原 sidecar 包
├── services/             # 新增：Wails 绑定服务层（薄包装业务逻辑）
│   ├── account.go  bucket.go  object.go  transfer.go
│   ├── cdn.go  governance.go  settings.go  system.go
├── internal/             # 从 sidecar/internal 迁入，业务逻辑零改动
│   ├── storage/ database/ crypto/ queue/ model/ config/
├── frontend/             # 现有 src/ + index.html + vite 配置迁入
├── build/                # Wails 构建配置、图标、Info.plist
└── （删除 src-tauri/、sidecar/cmd、server/、handler 的 Gin 部分）
```

module path 沿用 `github.com/goll/cloud-pika`，原 `sidecar/internal/...` import 路径相应调整为 `internal/...`。

## 4. 后端：handler → Wails service

8 个 service，方法签名改为纯 Go 入参/出参（结构体），可被 `wails3 generate bindings` 直接生成 TS。

```go
// 当前（Gin）：func (h *Handler) ListObjects(c *gin.Context)
// 改造后（Wails service）：
type ObjectService struct{ deps *core.Deps }

func (s *ObjectService) ListObjects(p ListParams) (ListResult, error) { ... }
func (s *ObjectService) Upload(p UploadParams) (TransferRef, error) { ... }
```

- handler 现有的参数解析/校验逻辑（如 `account_validation.go`）下沉为 service 内部方法或保留为 helper。
- 业务调用 `storage.Provider` 的部分原样复用。
- service 共享依赖（db、queue、config、crypto）通过一个 `Deps` 结构注入，避免每个 service 方法参数膨胀。

### Service ↔ 现有路由映射

| Service | 覆盖的原 Gin 路由 |
|:---|:---|
| AccountService | `/accounts*`、`/accounts/:id/features` |
| BucketService | `/providers/:p/buckets`、`/buckets/:b/objects`、`/buckets/:b/domains` |
| ObjectService | `/objects/upload\|download\|fetch\|rename\|folder\|url`、`DELETE /objects` |
| TransferService | `/transfers`、`/transfers/:id/cancel` |
| CDNService | `/cdn/refresh\|prefetch\|quota` |
| GovernanceService | `/buckets/:b/lifecycle\|cors\|referer\|encryption\|versioning\|objects/versions` |
| SettingsService | `/settings` |
| SystemService | native：文件对话框、剪贴板、托盘（无对应 Gin 路由） |

## 5. 事件系统：SSE → Wails Events

传输队列进度推送从 SSE 改为 Wails 事件。

```go
// queue.Manager 当前往 SSEHub 推 → 改为往一个 EventEmitter 接口推
// 定义 interface{ Emit(name string, data any) } 解耦 queue 与 Wails，便于测试
app.Event.Emit("transfer.progress", payload)
```

事件名沿用现有约定：`transfer.queued` / `transfer.progress` / `transfer.done` / `transfer.error` 等（以现有 `useSSE.ts` 监听的事件为准）。

前端 `useSSE.ts` → `useWailsEvents.ts`，用 `Events.On('transfer.progress', cb)`，去掉 EventSource / 指数退避重连（Wails 进程内事件不存在断线）。

## 6. Native 能力映射

| 现有 Tauri 命令 | Wails v3 替代 |
|:---|:---|
| `open_file_dialog` / `open_folder_dialog` | `application.OpenFileDialog()` ✅ |
| `write_clipboard_text` | `app.Clipboard().SetText()` ✅ |
| `read_clipboard_image` | ⚠️ Wails 剪贴板仅支持文本 → 用 `golang.design/x/clipboard` 读图存临时文件 |
| 系统托盘 `tray.rs` | `app.SystemTray()` ✅ |
| sidecar 进程管理（start/restart/health） | ❌ 删除（后端内嵌，不再需要） |

**剪贴板图片**：Wails v3 `Clipboard` 仅有 `SetText`/`Text`，不支持图片。复用现有"读剪贴板图片 → 存临时 PNG → 返回路径"的契约，底层换用 `golang.design/x/clipboard`（跨平台支持图片读取，macOS 已验证）。

## 7. 前端改造

- 删除 `src/lib/api-client.ts`（233 行 axios）、`src/lib/tauri.ts`、token 相关代码。
- `src/hooks/useCloudApi.ts` 改为调用生成的 bindings（方法签名与现有 `cloudApi` 基本一一对应，改动可控）。
- `src/hooks/useSidecarBootstrap.ts` / `useSidecarWatchdog.ts` 大幅简化或删除（无进程、无健康检查、无 token 握手）。
- `src/hooks/useSSE.ts` → 基于 Wails Events 的新 hook。
- 视觉/组件层（Cirrus Ether 设计系统）**完全不动**，留给第二个子项目。
- bindings 生成的 TS 类型与现有 `src/types/*` 可能不一致：**以生成类型为准**，适配 store 层。

## 8. 数据库与路径

SQLite 数据库路径从「Tauri 提供的 app_data_dir」改为「Wails 提供的应用数据目录」。迁移需保证 macOS 上路径稳定，避免老用户数据丢失（如路径变化需做一次性数据迁移或文档说明）。

## 9. 构建工具链

- 新增 `wails3` CLI（`go install github.com/wailsapp/wails/v3/cmd/wails3@<锁定版本>`）。
- 用 `Taskfile.yml`（Wails v3 默认）或保留 Makefile 包装 `wails3 dev` / `wails3 build`。
- 删除 `sidecar-build` / `tauri:dev` / `tauri:build` 相关脚本。
- 仅 macOS 目标，`wails3 build` 产 `.app`。

## 10. 风险与回退

| 风险 | 应对 |
|:---|:---|
| Wails v3 alpha API 变动 | 锁定具体 alpha 版本号；尝鲜定位可接受 |
| 剪贴板图片不支持 | `golang.design/x/clipboard` 已验证支持 macOS |
| 生成 TS 类型与现有 types 不一致 | 以生成类型为准，适配 store 层 |
| 迁移期应用不可用 | 用 git worktree 隔离，main 分支保持 Tauri 可用直到验收通过 |
| Gin handler 业务逻辑遗漏 | 以「Service ↔ 路由映射」逐条核对，确保全覆盖 |

## 11. 验证策略

逐 service 验证，以「功能与现版本对等」为验收标准：

1. 账号 CRUD
2. 列桶 / 列对象
3. 上传 / 下载（含进度事件实时推送）
4. CDN 刷新/预热/配额、桶治理（生命周期/CORS/Referer/加密/版本控制）
5. 剪贴板粘贴上传
6. 系统托盘菜单与上传入口

## 12. 范围边界（YAGNI）

- **不做**：UI 视觉升级（独立子项目）、Windows/Linux 适配、HTTP 调试通道、Web 版。
- **只做**：把现有全部功能在 Wails v3 上原样跑通，且通信走原生 binding + events。
