# Wails v3 彻底原生迁移 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Cloud Pika 从 Tauri(Rust) 外壳迁移到 Wails v3，去掉本地 HTTP/SSE/token，Go 业务逻辑通过 Wails 绑定服务 + 事件直接暴露给前端。

**Architecture:** 业务逻辑（storage/database/crypto/queue/model/config）从 `sidecar/internal` 迁入主 module 的 `internal/`，零改动复用。新增 `services/` 薄层把现有 Gin handler 改造为 Wails 绑定服务（纯 Go 入参/出参）。传输进度复用 queue 已有的 `publisher` 接口，换成 Wails 事件实现。前端删除 axios/SSE/token，改用 Wails 生成的 TS bindings + `@wailsio/runtime` 的 Events。

**Tech Stack:** Go 1.25 · Wails v3 (alpha，锁定版本) · React 18 + Vite 6 · `golang.design/x/clipboard`（剪贴板图片）· 仅 macOS。

**前置说明（执行前必读）:**
- 本计划应在 **git worktree** 中执行（用 `superpowers:using-git-worktrees` 创建），`main` 分支保留可用的 Tauri 版本直到验收通过。
- 这是**迁移**而非新开发：多数 service 方法的业务逻辑**直接复制自现有 handler**，按统一配方剥离 Gin。已有的 Go 单元测试（`*_test.go`）是回归安全网，每步必须保持通过。
- 提交遵循用户规则：每次 `git commit` 前先 `/local-review`。下文 commit 步骤默认你已通过 review。

---

## 文件结构总览

**新增：**
- `main.go` — Wails 应用入口，装配 services / 事件 / 托盘 / 数据库
- `internal/core/deps.go` — service 共享依赖注入容器 `Deps`
- `internal/events/emitter.go` — `publisher` 的 Wails 事件实现
- `services/account.go` `bucket.go` `object.go` `transfer.go` `cdn.go` `governance.go` `settings.go` `system.go` — 8 个绑定服务
- `internal/system/clipboard_image.go` — 剪贴板图片读取（`golang.design/x/clipboard`）
- `Taskfile.yml` — Wails v3 构建任务

**迁移（移动 + 改 import 路径）：**
- `sidecar/internal/{storage,database,crypto,queue,model,config}` → `internal/{...}`
- `src/` `index.html` `vite.config.ts` 等前端 → `frontend/`

**修改：**
- `frontend/src/hooks/useCloudApi.ts` — axios → 生成的 bindings
- `frontend/src/hooks/useSSE.ts` → `useWailsEvents.ts` — EventSource → Wails Events
- `frontend/src/hooks/useSidecarBootstrap.ts` / `useSidecarWatchdog.ts` — 简化/删除
- `go.mod` — 主 module 提升，加入 Wails 依赖

**删除：**
- `src-tauri/` 整个目录
- `sidecar/cmd/`、`sidecar/internal/server/`（Gin router/server/sse/middleware）、`sidecar/internal/handler/`（Gin handler，逻辑已迁入 services）
- `frontend/src/lib/api-client.ts`、`frontend/src/lib/tauri.ts`

---

## 阶段一：脚手架与 module 重构

### Task 1: 锁定 Wails v3 版本并安装 CLI

**Files:** 无（环境准备）

- [ ] **Step 1: 查最新 alpha 版本并记录**

Run: `go list -m -versions github.com/wailsapp/wails/v3 2>/dev/null | tr ' ' '\n' | tail -5`
记下要锁定的版本号（如 `v3.0.0-alpha.98`），后续所有命令统一用该版本。

- [ ] **Step 2: 安装 wails3 CLI**

Run: `go install github.com/wailsapp/wails/v3/cmd/wails3@<锁定版本>`
Expected: 安装成功，`wails3 version` 能输出版本。

- [ ] **Step 3: 验证 doctor**

Run: `wails3 doctor`
Expected: macOS 依赖（Xcode CLT 等）全部 OK；如有缺失按提示安装。

### Task 2: 迁移业务逻辑包到主 module

把 `sidecar/internal/{storage,database,crypto,queue,model,config}` 迁入根 module，import 路径从 `github.com/goll/cloud-pika/sidecar/internal/...` 改为 `github.com/goll/cloud-pika/internal/...`。

**Files:**
- Modify: `go.mod`（根目录新建/提升）
- Move: `sidecar/internal/{storage,database,crypto,queue,model,config}` → `internal/`

- [ ] **Step 1: 根目录建立主 module**

Run:
```bash
test -f go.mod || go mod init github.com/goll/cloud-pika
```
Expected: 根目录存在 `go.mod`，module path 为 `github.com/goll/cloud-pika`。

- [ ] **Step 2: 移动业务包**

Run:
```bash
mkdir -p internal
git mv sidecar/internal/storage internal/storage
git mv sidecar/internal/database internal/database
git mv sidecar/internal/crypto internal/crypto
git mv sidecar/internal/queue internal/queue
git mv sidecar/internal/model internal/model
git mv sidecar/internal/config internal/config
```

- [ ] **Step 3: 批量改 import 路径**

Run:
```bash
grep -rl 'goll/cloud-pika/sidecar/internal' internal | \
  xargs sed -i '' 's#goll/cloud-pika/sidecar/internal#goll/cloud-pika/internal#g'
```
Expected: `grep -rn 'sidecar/internal' internal` 无输出。

- [ ] **Step 4: 同步依赖**

Run: `go mod tidy`
Expected: `go.mod` 收集到 gin（暂留，handler 删除后会清掉）、minio、uuid、sqlite 等依赖，无报错。

- [ ] **Step 5: 编译业务包**

Run: `go build ./internal/...`
Expected: 编译通过（此时 handler/server 仍在 sidecar 下，未迁，故只编 internal）。

- [ ] **Step 6: 跑业务包单元测试（回归基线）**

Run: `go test ./internal/...`
Expected: 全部 PASS（storage conformance、queue、crypto、account_validation 等现有测试）。这是迁移的回归基线，记录通过结果。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: 业务逻辑包迁入主 module"
```

### Task 3: 定义 service 共享依赖容器 Deps

8 个 service 共享同一组依赖（config、crypto、各 store、queue、provider factory）。用一个 `Deps` 容器一次性注入，避免每个 service 构造函数参数膨胀（≤4 参数规则）。

**Files:**
- Create: `internal/core/deps.go`

- [ ] **Step 1: 写 Deps 容器**

```go
package core

import (
	"database/sql"

	"github.com/goll/cloud-pika/internal/config"
	"github.com/goll/cloud-pika/internal/crypto"
	"github.com/goll/cloud-pika/internal/database"
	"github.com/goll/cloud-pika/internal/queue"
	"github.com/goll/cloud-pika/internal/storage"
)

// Deps 聚合所有绑定服务共享的依赖，统一注入避免构造参数膨胀。
type Deps struct {
	Cfg       config.Config              // 运行配置（含 MasterKey）
	Encryptor crypto.Service             // 密钥加解密
	Accounts  database.AccountStore      // 账号存储
	Settings  database.SettingsStore     // 应用设置存储
	Transfers database.TransferStore     // 传输任务存储
	Queue     *queue.Manager             // 传输队列
	Providers storage.ProviderFactory    // 云存储 provider 工厂
}

// NewDeps 基于数据库连接与队列构建依赖容器。
func NewDeps(cfg config.Config, db *sql.DB, q *queue.Manager) *Deps {
	return &Deps{
		Cfg:       cfg,
		Encryptor: crypto.NewService(cfg.MasterKey),
		Accounts:  database.NewAccountStore(db),
		Settings:  database.NewSettingsStore(db),
		Transfers: database.NewTransferStore(db),
		Queue:     q,
		Providers: storage.NewFactory(),
	}
}
```

- [ ] **Step 2: 编译**

Run: `go build ./internal/...`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add internal/core/deps.go
git commit -m "feat: 新增 service 共享依赖容器 Deps"
```

### Task 4: 初始化 Wails v3 骨架文件

不用 `wails3 init` 覆盖现有工程，手动补齐 Wails 所需的最小文件（`main.go` 先放占位空 app，后续 Task 逐步填充 services）。

**Files:**
- Create: `main.go`
- Modify: `go.mod`（加入 wails/v3 依赖）

- [ ] **Step 1: 写最小 main.go**

```go
package main

import (
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

func main() {
	app := application.New(application.Options{
		Name:        "Cloud Pika",
		Description: "多云对象存储管理客户端",
	})

	app.NewWebviewWindow()

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
```

- [ ] **Step 2: 拉取 Wails 依赖**

Run: `go get github.com/wailsapp/wails/v3@<锁定版本> && go mod tidy`
Expected: `go.mod` 出现 wails/v3，无报错。

- [ ] **Step 3: 编译**

Run: `go build .`
Expected: 生成可执行文件（暂不运行，前端尚未接好）。

- [ ] **Step 4: Commit**

```bash
git add main.go go.mod go.sum
git commit -m "feat: 初始化 Wails v3 应用骨架"
```

---

## 阶段二：后端绑定服务层

> **统一改造配方（每个 service 适用）**：从对应的现有 `sidecar/internal/handler/<name>.go` 复制方法体，按 3 条规则机械转换：
> 1. 方法签名 `func (h *Handler) X(c *gin.Context)` → `func (s *XService) X(参数结构体) (返回结构体, error)`；路径/query 参数（`c.Param`/`c.Query`）和 body（`c.ShouldBindJSON`）合并进入参结构体。
> 2. 所有 `c.JSON(status, gin.H{"error": err})` + `return` → `return 零值, err`（错误直接返回，由 Wails 透传前端）。
> 3. 所有 `c.JSON(status, gin.H{"key": v})` 成功响应 → `return v, nil`。
> 4. `h.xxx` 依赖访问改为 `s.deps.Xxx`。
> 入参/出参结构体优先复用 `internal/model` 已有类型；确实需要新结构体时定义在该 service 文件内并加行尾注释。

### Task 5: AccountService（完整范例）

本 task 给出**完整代码**作为后续 service 的范例。逻辑复制自 `sidecar/internal/handler/account.go` + `handler.go` 的账号相关 helper。

**Files:**
- Create: `services/account.go`
- Test: `services/account_test.go`

- [ ] **Step 1: 写 AccountService**

```go
package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/model"
)

// AccountService 暴露账号管理能力给前端绑定。
type AccountService struct {
	deps *core.Deps
}

func NewAccountService(deps *core.Deps) *AccountService {
	return &AccountService{deps: deps}
}

// List 返回所有账号（密钥已脱敏）。
func (s *AccountService) List() ([]model.Account, error) {
	accounts, _, err := s.deps.Accounts.List()
	if err != nil {
		return nil, err
	}
	result := make([]model.Account, 0, len(accounts))
	for _, a := range accounts {
		a.SecretKey = ""
		result = append(result, a)
	}
	return result, nil
}

// Create 校验连通性后创建账号，返回脱敏账号。
func (s *AccountService) Create(payload model.ProviderConfig) (model.Account, error) {
	normalized, err := normalizeProviderConfig(payload)
	if err != nil {
		return model.Account{}, err
	}
	now := time.Now().UTC()
	account := model.Account{
		ID: uuid.NewString(), Provider: normalized.Provider, Name: normalized.Name,
		AccessKey: normalized.AccessKey, Endpoint: normalized.Endpoint, Region: normalized.Region,
		ServiceName: normalized.ServiceName, Internal: normalized.Internal, Paging: normalized.Paging,
		CreatedAt: now, UpdatedAt: now,
	}
	account.SecretKey = normalized.SecretKey
	if err = s.validateConnectivity(account); err != nil {
		return model.Account{}, err
	}
	encrypted, err := s.deps.Encryptor.Encrypt(normalized.SecretKey)
	if err != nil {
		return model.Account{}, err
	}
	if err = s.deps.Accounts.Create(account, encrypted); err != nil {
		return model.Account{}, err
	}
	account.SecretKey = ""
	return account, nil
}

// Update 更新账号；空密钥表示沿用原密钥。
func (s *AccountService) Update(id string, payload model.ProviderConfig) (model.Account, error) {
	if id == "" {
		return model.Account{}, errors.New("account id required")
	}
	old, encryptedSecret, err := s.deps.Accounts.FindByID(id)
	if err != nil {
		return model.Account{}, err
	}
	secret := strings.TrimSpace(payload.SecretKey)
	if secret == "" {
		if secret, err = s.deps.Encryptor.Decrypt(encryptedSecret); err != nil {
			return model.Account{}, err
		}
	}
	payload.SecretKey = secret
	normalized, err := normalizeProviderConfig(payload)
	if err != nil {
		return model.Account{}, err
	}
	updated := old
	updated.Provider, updated.Name = normalized.Provider, normalized.Name
	updated.AccessKey, updated.Endpoint, updated.Region = normalized.AccessKey, normalized.Endpoint, normalized.Region
	updated.ServiceName, updated.Internal, updated.Paging = normalized.ServiceName, normalized.Internal, normalized.Paging
	updated.UpdatedAt = time.Now().UTC()
	updated.SecretKey = normalized.SecretKey
	if err = s.validateConnectivity(updated); err != nil {
		return model.Account{}, err
	}
	encrypted, err := s.deps.Encryptor.Encrypt(normalized.SecretKey)
	if err != nil {
		return model.Account{}, err
	}
	if err = s.deps.Accounts.Update(updated, encrypted); err != nil {
		return model.Account{}, err
	}
	updated.SecretKey = ""
	return updated, nil
}

// Delete 删除账号。
func (s *AccountService) Delete(id string) error {
	if id == "" {
		return errors.New("account id required")
	}
	return s.deps.Accounts.Delete(id)
}

func (s *AccountService) validateConnectivity(account model.Account) error {
	provider, err := s.deps.Providers.Create(account.Provider)
	if err != nil {
		return fmt.Errorf("unsupported provider %s: %w", account.Provider, err)
	}
	if err = provider.Init(account); err != nil {
		return fmt.Errorf("provider init failed: %w", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	if _, err = provider.ListBuckets(ctx); err != nil {
		return fmt.Errorf("credential validation failed: %w", err)
	}
	return nil
}
```

- [ ] **Step 2: 迁移 normalizeProviderConfig**

`normalizeProviderConfig` 与校验错误类型当前在 `sidecar/internal/handler/account_validation.go`。把该文件中**不依赖 gin** 的纯函数（`normalizeProviderConfig` 及其 helper）复制到新文件 `services/validation.go`（package services），删除其中 gin 相关的 `writeValidationError`（错误已直接 return）。

Run: `go build ./services/...`
Expected: 通过，无 gin import。

- [ ] **Step 3: 写测试（复用现有校验测试）**

把 `sidecar/internal/handler/account_validation_test.go` 中针对 `normalizeProviderConfig` 的用例复制到 `services/validation_test.go`，调整 package 名为 `services`。

- [ ] **Step 4: 跑测试**

Run: `go test ./services/...`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add services/ && git commit -m "feat: 新增 AccountService 绑定服务"
```

### Task 6: BucketService

逻辑复制自 `sidecar/internal/handler/bucket.go`（`ListBuckets` / `ListObjects` / `ListDomains`）。按统一配方转换。

**Files:**
- Create: `services/bucket.go`

- [ ] **Step 1: 写 BucketService**

参照 Task 5 范例结构（`type BucketService struct{ deps *core.Deps }` + `NewBucketService`）。方法签名：
```go
func (s *BucketService) ListBuckets(provider, accountID string) ([]model.BucketInfo, error)
func (s *BucketService) ListObjects(p model.ListParams) (model.ListResult, error) // p 含 AccountID/Bucket/Prefix/Marker/Limit
func (s *BucketService) ListDomains(accountID, bucket string) ([]string, error)
```
方法体：从对应 handler 复制「取账号（用 `s.accountWithSecret` 等价逻辑：`s.deps.Accounts.FindByID` + `s.deps.Encryptor.Decrypt`）→ `s.deps.Providers.Create` + `Init` → 调 provider 方法」的流程，按配方剥离 gin。
> 注意：handler 里的 `h.accountWithSecret(id)` helper 也需迁移。把它作为 `services/helpers.go` 中的共享函数 `accountWithSecret(deps *core.Deps, id string) (model.Account, error)`（逻辑见 `handler.go:49-64`），供多个 service 复用。

- [ ] **Step 2: 编译**

Run: `go build ./services/...`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add services/ && git commit -m "feat: 新增 BucketService 绑定服务"
```

### Task 7: ObjectService

逻辑复制自 `sidecar/internal/handler/object.go`（upload/download/fetch/rename/folder/delete/url）。上传/下载/fetch 经 `s.deps.Queue.Enqueue` 入队，返回 `{TransferID string}`。

**Files:**
- Create: `services/object.go`

- [ ] **Step 1: 写 ObjectService**

方法签名（入参复用 `model` 中现有 `UploadParams`/`DownloadParams`/`RenameParams` 等，没有则在文件内定义并加行尾注释）：
```go
func (s *ObjectService) Upload(p model.UploadParams) (TransferRef, error)
func (s *ObjectService) Download(p model.DownloadParams) (TransferRef, error)
func (s *ObjectService) Fetch(p model.UploadParams) (TransferRef, error)
func (s *ObjectService) Rename(p model.RenameParams) error
func (s *ObjectService) CreateFolder(accountID, bucket, key string) error
func (s *ObjectService) Delete(accountID, bucket string, keys []string) error
func (s *ObjectService) GenerateURL(p model.SignedURLParams) (URLResult, error)
```
在文件内定义返回类型：
```go
type TransferRef struct {
	TransferID string `json:"transferId"` // 入队后生成的传输任务 ID
}
type URLResult struct {
	URL string `json:"url"` // 生成的签名/访问 URL
}
```
方法体从 handler 复制，入队部分保持调用 `s.deps.Queue.Enqueue(...)`，返回 `TransferRef{TransferID: id}, nil`。

- [ ] **Step 2: 编译**

Run: `go build ./services/...`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add services/ && git commit -m "feat: 新增 ObjectService 绑定服务"
```

### Task 8: TransferService、CDNService、GovernanceService、SettingsService

四个服务模式相同，逻辑分别复制自 `transfer.go` / `cdn.go` / `governance.go` / `settings.go`，按统一配方转换。

**Files:**
- Create: `services/transfer.go` `services/cdn.go` `services/governance.go` `services/settings.go`

- [ ] **Step 1: TransferService**

```go
func (s *TransferService) List() ([]model.TransferTask, error)   // 复制自 transfer.go ListTransfers
func (s *TransferService) Cancel(id string) error                // 复制自 transfer.go CancelTransfer
```

- [ ] **Step 2: CDNService**

```go
func (s *CDNService) Refresh(accountID string, urls []string) error
func (s *CDNService) Prefetch(accountID string, urls []string) error
func (s *CDNService) Quota(accountID string) (*model.CDNQuota, error) // 失败返回 nil,err；前端容错
```

- [ ] **Step 3: GovernanceService**

```go
func (s *GovernanceService) GetLifecycle(accountID, bucket string) ([]model.LifecycleRule, error)
func (s *GovernanceService) PutLifecycle(p model.LifecyclePayload) error      // 含 AccountID/Bucket/Rules
func (s *GovernanceService) DeleteLifecycle(accountID, bucket string) error
func (s *GovernanceService) GetCORS(accountID, bucket string) ([]model.CORSRule, error)
func (s *GovernanceService) PutCORS(p model.CORSPayload) error
func (s *GovernanceService) GetReferer(accountID, bucket string) (model.RefererConfig, error)
func (s *GovernanceService) PutReferer(p model.RefererPayload) error
func (s *GovernanceService) GetEncryption(accountID, bucket string) (model.EncryptionConfig, error)
func (s *GovernanceService) PutEncryption(p model.EncryptionPayload) error
func (s *GovernanceService) GetVersioning(accountID, bucket string) (string, error)
func (s *GovernanceService) PutVersioning(accountID, bucket, status string) error
func (s *GovernanceService) ListObjectVersions(p model.VersionListParams) (model.VersionListResult, error)
```
> Put* 的入参结构体若 `model` 中没有，定义在 `governance.go` 内并加行尾注释（含 AccountID/Bucket + 配置体）。

- [ ] **Step 4: SettingsService**

```go
func (s *SettingsService) Get() (model.AppSettings, error)
func (s *SettingsService) Update(settings model.AppSettings) (model.AppSettings, error)
func (s *SettingsService) ProviderFeatures(accountID string) ([]string, error) // 复制自 account.go GetProviderFeatures
```

- [ ] **Step 5: 编译全部 service**

Run: `go build ./services/...`
Expected: 通过。

- [ ] **Step 6: Commit**

```bash
git add services/ && git commit -m "feat: 新增 Transfer/CDN/Governance/Settings 绑定服务"
```

---

## 阶段三：事件系统（SSE → Wails Events）

### Task 9: Wails 事件 publisher 实现

`queue.Manager` 已通过 `publisher` 接口（`Publish(event string, payload any)`）解耦。只需提供一个把事件转发到 Wails 的实现。

**Files:**
- Create: `internal/events/emitter.go`
- Test: `internal/events/emitter_test.go`

- [ ] **Step 1: 写失败测试**

```go
package events

import "testing"

// fakeEmitter 记录收到的事件，验证 WailsPublisher 正确转发。
type fakeEmitter struct {
	name string
	data any
}

func (f *fakeEmitter) EmitEvent(name string, data ...any) {
	f.name = name
	if len(data) > 0 {
		f.data = data[0]
	}
}

func TestWailsPublisher_Publish(t *testing.T) {
	fake := &fakeEmitter{}
	pub := NewWailsPublisher(fake)
	pub.Publish("transfer.progress", map[string]any{"id": "x"})
	if fake.name != "transfer.progress" {
		t.Fatalf("event name = %q, want transfer.progress", fake.name)
	}
	if fake.data == nil {
		t.Fatal("data not forwarded")
	}
}
```

- [ ] **Step 2: 跑测试确认失败**

Run: `go test ./internal/events/...`
Expected: FAIL（`NewWailsPublisher` undefined）。

- [ ] **Step 3: 写实现**

```go
package events

// emitter 抽象 Wails 应用的事件发射能力，便于测试替身。
// *application.App 满足该接口（EmitEvent(name string, data ...any)）。
type emitter interface {
	EmitEvent(name string, data ...any)
}

// WailsPublisher 把 queue 的事件转发为 Wails 前端事件，
// 实现 queue.publisher 接口（Publish(event string, payload any)）。
type WailsPublisher struct {
	app emitter
}

func NewWailsPublisher(app emitter) *WailsPublisher {
	return &WailsPublisher{app: app}
}

// Publish 将队列事件原样转发到 Wails 事件总线。
func (p *WailsPublisher) Publish(event string, payload any) {
	p.app.EmitEvent(event, payload)
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `go test ./internal/events/...`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add internal/events/ && git commit -m "feat: 新增 Wails 事件 publisher"
```

> **注**：`*application.App` 的实际事件方法名以锁定版本为准（可能是 `EmitEvent` 或 `Event.Emit`）。若签名不同，仅需调整 `emitter` 接口定义与 main.go 装配处，`WailsPublisher` 逻辑不变。验证方式见 Task 11。

---

## 阶段四：原生能力（SystemService）

### Task 10: SystemService（对话框 + 剪贴板 + 托盘入口）

替代 `src-tauri/src/commands/system.rs` 与 `tray.rs`。文件对话框/文本剪贴板用 Wails 原生 API；剪贴板图片用 `golang.design/x/clipboard`。

**Files:**
- Create: `services/system.go`
- Create: `internal/system/clipboard_image.go`
- Test: `internal/system/clipboard_image_test.go`

- [ ] **Step 1: 加剪贴板图片依赖**

Run: `go get golang.design/x/clipboard@latest && go mod tidy`
Expected: 成功。

- [ ] **Step 2: 写剪贴板图片读取（含降级测试）**

`internal/system/clipboard_image.go`：
```go
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
// 沿用原 Tauri read_clipboard_image 的契约：成功返回临时 PNG 路径。
func ReadClipboardImageToTemp(tempDir string, nowUnixMilli int64) (string, error) {
	if clipboardInitErr != nil {
		return "", fmt.Errorf("clipboard init failed: %w", clipboardInitErr)
	}
	data := clipboard.Read(clipboard.FmtImage)
	if len(data) == 0 {
		return "", ErrNoClipboardImage
	}
	path := filepath.Join(tempDir, fmt.Sprintf("cloud-pika-clipboard-%d.png", nowUnixMilli))
	if err := os.WriteFile(path, data, 0o600); err != nil {
		return "", err
	}
	return path, nil
}
```
> 注入 `tempDir`/`nowUnixMilli` 而非内部取，便于测试（遵守 Go 可测性）。

- [ ] **Step 3: 写测试**

`internal/system/clipboard_image_test.go`：验证「给定一段 PNG 字节，写入指定 temp 目录后文件存在且内容一致」的纯文件逻辑（把可测部分抽成 `writeImageToTemp(dir string, ts int64, data []byte) (string, error)` 并测它）。
```go
func TestWriteImageToTemp(t *testing.T) {
	dir := t.TempDir()
	path, err := writeImageToTemp(dir, 123, []byte("PNGDATA"))
	if err != nil {
		t.Fatal(err)
	}
	got, _ := os.ReadFile(path)
	if string(got) != "PNGDATA" {
		t.Fatalf("content = %q", got)
	}
}
```
（把 Step 2 的文件写入部分重构为 `writeImageToTemp` 供复用与测试。）

- [ ] **Step 4: 跑测试**

Run: `go test ./internal/system/...`
Expected: PASS。

- [ ] **Step 5: 写 SystemService**

`services/system.go`，持有 Wails app 引用以调用原生对话框/剪贴板：
```go
package services

import (
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"

	"github.com/goll/cloud-pika/internal/system"
)

// SystemService 暴露原生系统能力（对话框、剪贴板、托盘上传）。
type SystemService struct {
	app *application.App
}

func NewSystemService(app *application.App) *SystemService {
	return &SystemService{app: app}
}

// OpenFileDialog 打开多选文件对话框，返回选中路径。
func (s *SystemService) OpenFileDialog() ([]string, error) {
	dialog := application.OpenFileDialog().CanChooseFiles(true).AllowsMultipleSelection(true)
	return dialog.PromptForMultipleSelection()
}

// OpenFolderDialog 打开文件夹选择对话框。
func (s *SystemService) OpenFolderDialog() ([]string, error) {
	dialog := application.OpenFileDialog().CanChooseDirectories(true).CanChooseFiles(false)
	path, err := dialog.PromptForSingleSelection()
	if err != nil || path == "" {
		return []string{}, err
	}
	return []string{path}, nil
}

// WriteClipboardText 写入文本到剪贴板。
func (s *SystemService) WriteClipboardText(text string) error {
	s.app.Clipboard().SetText(text)
	return nil
}

// ReadClipboardImage 读取剪贴板图片存临时 PNG，返回路径。
func (s *SystemService) ReadClipboardImage() (string, error) {
	return system.ReadClipboardImageToTemp(osTempDir(), time.Now().UnixMilli())
}
```
> Wails v3 对话框 API 的精确方法名以锁定版本为准（`PromptForMultipleSelection`/`PromptForSingleSelection` 可能命名不同）；以 `go doc github.com/wailsapp/wails/v3/pkg/application OpenFileDialog` 为准微调。`osTempDir()` 为 `os.TempDir` 的薄封装。

- [ ] **Step 6: 编译**

Run: `go build ./services/...`
Expected: 通过。

- [ ] **Step 7: Commit**

```bash
git add services/ internal/system/ go.mod go.sum
git commit -m "feat: 新增 SystemService（对话框/剪贴板/剪贴板图片）"
```

---

## 阶段五：Wails 应用装配

### Task 11: main.go 装配 services / 事件 / 数据库 / 托盘

**Files:**
- Modify: `main.go`

- [ ] **Step 1: 写完整 main.go**

```go
package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"

	"github.com/goll/cloud-pika/internal/config"
	"github.com/goll/cloud-pika/internal/core"
	"github.com/goll/cloud-pika/internal/database"
	"github.com/goll/cloud-pika/internal/events"
	"github.com/goll/cloud-pika/internal/queue"
	"github.com/goll/cloud-pika/services"
)

func main() {
	dbPath := resolveDBPath()
	db, err := database.Open(dbPath)
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
	})

	// 事件 publisher 复用 queue 已有的 publisher 接口
	pub := events.NewWailsPublisher(app)
	queueMgr := queue.NewManager(db, pub)

	cfg := config.Config{MasterKey: resolveMasterKey()} // 不再需要 Port/Token/Host
	deps := core.NewDeps(cfg, db, queueMgr)

	app.RegisterService(application.NewService(services.NewAccountService(deps)))
	app.RegisterService(application.NewService(services.NewBucketService(deps)))
	app.RegisterService(application.NewService(services.NewObjectService(deps)))
	app.RegisterService(application.NewService(services.NewTransferService(deps)))
	app.RegisterService(application.NewService(services.NewCDNService(deps)))
	app.RegisterService(application.NewService(services.NewGovernanceService(deps)))
	app.RegisterService(application.NewService(services.NewSettingsService(deps)))
	app.RegisterService(application.NewService(services.NewSystemService(app)))

	app.NewWebviewWindow()
	setupSystemTray(app) // Task 12

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
```
> `config.Config` 当前含 Port/Token/Host/DBPath/MasterKey。本步骤起这些字段中只用 MasterKey；`config.Load()`（读 CLI flag）不再使用，可在 Task 14 清理时删除 flag 解析。`RegisterService`/`NewService`/`application.NewService` 的精确 API 以锁定版本 `go doc` 为准。`resolveMasterKey` 沿用原 config 中的主密钥来源逻辑。

- [ ] **Step 2: 用 go doc 校准 Wails API**

Run:
```bash
go doc github.com/wailsapp/wails/v3/pkg/application Options
go doc github.com/wailsapp/wails/v3/pkg/application App
go doc github.com/wailsapp/wails/v3/pkg/application NewService
```
按实际签名修正 Step 1 中的服务注册、事件方法（对齐 Task 9 的 `emitter` 接口）、窗口创建调用。

- [ ] **Step 3: 临时桩 setupSystemTray**

先加空实现保证编译：`func setupSystemTray(app *application.App) {}`（Task 12 填充）。

- [ ] **Step 4: 编译**

Run: `go build .`
Expected: 通过。

- [ ] **Step 5: Commit**

```bash
git add main.go && git commit -m "feat: Wails 应用装配 services 与事件"
```

### Task 12: 系统托盘

复制 `src-tauri/src/tray.rs` 的菜单结构（先读它确认菜单项）。

**Files:**
- Create: `internal/tray/tray.go`
- Modify: `main.go`（`setupSystemTray` 调用 tray 包）

- [ ] **Step 1: 读现有托盘逻辑**

Run: `cat src-tauri/src/tray.rs`
记录菜单项（如「上传文件」「显示窗口」「退出」）与图标来源。

- [ ] **Step 2: 写托盘**

`internal/tray/tray.go`：用 `app.NewSystemTray()` 创建托盘，菜单项与 tray.rs 对齐。「上传文件」项触发 `app.EmitEvent("tray.upload", nil)`，前端监听后调用 `SystemService.OpenFileDialog` 进入上传流程（替代原 `tray_upload_select`）。

- [ ] **Step 3: main.go 接入**

`setupSystemTray` 改为调用 `tray.Setup(app)`。

- [ ] **Step 4: 编译**

Run: `go build .`
Expected: 通过。

- [ ] **Step 5: Commit**

```bash
git add internal/tray/ main.go && git commit -m "feat: 迁移系统托盘到 Wails"
```

---

## 阶段六：前端迁移

### Task 13: 前端目录迁入 frontend/ 并接入 Wails 配置

**Files:**
- Move: `src/` `index.html` `vite.config.ts` `tsconfig*.json` `tailwind.config.ts` `postcss.config.cjs` `public/` → `frontend/`
- Create: `frontend/wails.json` 或在根 `Taskfile.yml` 配置前端路径

- [ ] **Step 1: 移动前端**

Run:
```bash
mkdir -p frontend
git mv src index.html vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.ts postcss.config.cjs public package.json package-lock.json frontend/
```

- [ ] **Step 2: 安装 Wails 运行时前端包**

Run: `cd frontend && npm install @wailsio/runtime`
Expected: 写入 `frontend/package.json`。

- [ ] **Step 3: 配置 Wails 前端构建路径**

按锁定版本要求创建 `Taskfile.yml`（参考 `wails3 init` 生成的模板），指定 `frontend/` 为前端目录、`npm run build` 为构建命令、`frontend/dist` 为产物。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor: 前端迁入 frontend/ 并接入 Wails 运行时"
```

### Task 14: 生成 bindings 并替换 api-client

**Files:**
- Modify: `frontend/src/hooks/useCloudApi.ts`
- Delete: `frontend/src/lib/api-client.ts`、`frontend/src/lib/tauri.ts`

- [ ] **Step 1: 生成 TS bindings**

Run: `wails3 generate bindings`
Expected: 在 `frontend/bindings/`（或锁定版本指定目录）生成各 service 的 TS 调用与类型。

- [ ] **Step 2: 改造 useCloudApi.ts**

把 `cloudApi.xxx(...)`（axios）逐一替换为生成的绑定调用（如 `AccountService.List()`）。方法语义与 `api-client.ts` 中的 `cloudApi` 一一对应（见 spec 第 4 节映射表）。错误处理：Wails 绑定调用 reject 的是普通 Error，去掉 axios 的 `error.response.data` 解析逻辑，直接用 `err.message`（后端已返回包含 provider/stage 的错误串）。

- [ ] **Step 3: 删除旧通信层**

Run: `git rm frontend/src/lib/api-client.ts frontend/src/lib/tauri.ts`

- [ ] **Step 4: 类型对齐**

bindings 生成的类型若与 `frontend/src/types/*` 字段不一致，以生成类型为准调整 store/组件引用。

Run: `cd frontend && npm run build`
Expected: `tsc` 类型检查通过、vite 构建成功。修复所有类型错误后再继续。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: 前端改用 Wails bindings 替代 axios"
```

### Task 15: 事件 hook 与 bootstrap 改造

**Files:**
- Create: `frontend/src/hooks/useWailsEvents.ts`
- Delete: `frontend/src/hooks/useSSE.ts`
- Modify: `frontend/src/hooks/useSidecarBootstrap.ts`、`useSidecarWatchdog.ts`、调用方

- [ ] **Step 1: 读现有 SSE hook 确认事件名与 payload 解析**

Run: `cat frontend/src/hooks/useSSE.ts`
记录监听的事件名。**以 Go 发射端为权威**：`transfer.queued` / `transfer.progress` / `transfer.completed` / `transfer.failed`（见 `internal/queue/manager.go`）。若前端原用 `transfer.done`，统一改为 `transfer.completed`。

- [ ] **Step 2: 写 useWailsEvents.ts**

```ts
import { useEffect } from 'react';
import { Events } from '@wailsio/runtime';
import { useTransferStore } from '@/stores/useTransferStore';
import type { TransferTask } from '@/types/cloud';

const EVENTS = ['transfer.queued', 'transfer.progress', 'transfer.completed', 'transfer.failed'];

// 监听 Wails 后端推送的传输事件，更新 transfer store。
export function useWailsEvents(): void {
  const upsert = useTransferStore((s) => s.upsertTransfer);
  useEffect(() => {
    const offs = EVENTS.map((name) =>
      Events.On(name, (e: { data: TransferTask }) => upsert(e.data)),
    );
    return () => offs.forEach((off) => off());
  }, [upsert]);
}
```
> 事件回调的 payload 形状以锁定版本 `@wailsio/runtime` 的 `Events.On` 签名为准（可能是 `e.data` 或直接 payload）；用 Task 16 的运行验证校准。

- [ ] **Step 3: 简化 bootstrap**

`useSidecarBootstrap.ts`：删除 `tauriApi.startSidecar` / 端口 token 握手 / `isTauriEnv` fallback。改为：直接 `SettingsService.Get()` 拉取设置 → 设置 locale/theme，无 sidecarUrl/token。删除 `useSidecarWatchdog.ts`（无进程可监控）及其调用。把 `useSSE` 调用替换为 `useWailsEvents`。

- [ ] **Step 4: 构建**

Run: `cd frontend && npm run build`
Expected: 通过，无对已删除模块的 import。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: SSE 改为 Wails 事件，简化启动流程"
```

---

## 阶段七：构建、清理与验证

### Task 16: 首次端到端运行（开发模式）

**Files:** 无

- [ ] **Step 1: 启动 dev**

Run: `wails3 dev`
Expected: 窗口打开，前端加载，无白屏；控制台无致命错误。

- [ ] **Step 2: 校准事件/对话框/绑定运行时差异**

逐项点测：账号列表加载、列桶。若绑定/事件因 alpha API 命名有运行时差异，回到对应 Task（9/11/15）按实际运行结果微调后重新 `wails3 dev`。

- [ ] **Step 3: Commit（如有校准修改）**

```bash
git add -A && git commit -m "fix: 校准 Wails alpha 运行时 API 差异"
```

### Task 17: 删除 Tauri 与 Gin 残留

**Files:**
- Delete: `src-tauri/`、`sidecar/`（cmd/server/handler，业务包已迁出）

- [ ] **Step 1: 确认无残留引用**

Run: `grep -rn "tauri\|@tauri-apps\|sidecar\|gin-gonic" frontend/src main.go services internal 2>/dev/null | grep -v node_modules`
Expected: 无业务代码引用（除注释/文档）。

- [ ] **Step 2: 删除目录与依赖**

Run:
```bash
git rm -r src-tauri sidecar
cd frontend && npm uninstall @tauri-apps/api @tauri-apps/cli axios
cd .. && go mod tidy
```
Expected: `go mod tidy` 后 gin 等仅服务端依赖从 go.mod 移除。

- [ ] **Step 3: 全量编译 + 测试**

Run: `go build ./... && go test ./... && (cd frontend && npm run build)`
Expected: 全部通过。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: 移除 Tauri 外壳与 Gin 服务端残留"
```

### Task 18: 构建 .app 并更新文档/构建脚本

**Files:**
- Modify: `Makefile`（或删除，统一用 Taskfile）、`README.md`/`README.en.md`

- [ ] **Step 1: 构建产物**

Run: `wails3 build`
Expected: 生成 macOS `.app`，双击可启动。

- [ ] **Step 2: 更新 Makefile/README**

把 `dev`/`build` 目标改为 `wails3 dev`/`wails3 build`，删除 `sidecar-build`/`tauri:*`。README 的架构说明与构建步骤更新为 Wails v3。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "docs: 构建脚本与文档迁移到 Wails v3"
```

### Task 19: 功能对等验收

**Files:** 无（人工验收，对照 spec 第 11 节）

- [ ] **Step 1: 逐项验收**（`wails3 dev` 下）
  - [ ] 账号 CRUD（新增触发连通性校验、编辑空密钥沿用、删除）
  - [ ] 列桶 / 列对象（含分页 marker）
  - [ ] 上传 / 下载（传输进度事件实时更新进度条）
  - [ ] fetch URL 抓取、重命名、新建文件夹、批量删除、生成签名 URL
  - [ ] CDN 刷新 / 预热 / 配额
  - [ ] 桶治理：生命周期 / CORS / Referer / 加密 / 版本控制 / 历史版本列表
  - [ ] 剪贴板文本写入（复制链接）
  - [ ] 剪贴板图片粘贴上传
  - [ ] 系统托盘菜单与上传入口
  - [ ] 主题切换、i18n 语言切换

- [ ] **Step 2: 记录验收结果**

把通过/不通过逐项记录在 PR 描述或本计划末尾。任何不通过项回到对应 Task 修复。

- [ ] **Step 3: 完成分支**

用 `superpowers:finishing-a-development-branch` 决定合并/PR 方式。合并前对完整 diff 跑 `/local-review`（遵守用户 commit 规则）。

---

## 自检记录（spec 覆盖核对）

- spec §2 总体架构 → Task 4/11（Wails 装配，删 HTTP/SSE/token）✅
- spec §3 module 组织 → Task 2（业务包迁入 internal）✅
- spec §4 handler→service（8 服务 + 路由映射）→ Task 5–8 ✅
- spec §5 SSE→事件 → Task 9/15（复用 publisher 接口）✅
- spec §6 native 能力（对话框/剪贴板/剪贴板图片/托盘）→ Task 10/12 ✅
- spec §7 前端改造 → Task 13–15 ✅
- spec §8 数据库路径 → Task 11 `resolveDBPath` ✅
- spec §9 构建工具链 → Task 1/13/18 ✅
- spec §10 风险（worktree 隔离 / 剪贴板库 / 类型对齐 / 版本锁定）→ 前置说明 + Task 1/10/14 ✅
- spec §11 验证策略 → Task 19 ✅
