# Cloud Pika 全面升级计划

> **背景**：Cloud Pika 是一个 Tauri 2 + React 18 + Go 的跨平台云存储管理客户端，目标复刻并超越 qiniuClient。当前项目已完成基础架构搭建和核心功能骨架，但UI粗糙、交互原始、多处功能未完成，距离"可用"还有较大差距。本计划从专业产品经理和UI设计师视角出发，系统性地将项目从"能跑"提升到"好用且美观"。

---

## 一、现状诊断

### 1.1 已完成（可复用的基础）

| 模块 | 完成度 | 说明 |
|------|--------|------|
| Tauri 壳层 | 90% | Sidecar生命周期、托盘、文件对话框、剪贴板 |
| Go 后端 API | 85% | 15+ API端点，9家云厂商适配器（又拍云除外） |
| SQLite 数据库 | 100% | 账户/设置/传输三表，AES加密 |
| SSE 事件流 | 100% | 实时进度推送 |
| 账户管理 | 90% | CRUD + 凭证验证 + 加密存储 |
| 文件浏览 | 70% | 列表/网格视图，但缺批量操作、排序、右键菜单 |
| 上传/下载 | 70% | 基础上传下载，缺分片、断点续传 |
| 主题系统 | 80% | CSS变量完整，缺过渡动画 |
| 国际化 | 70% | 框架就绪，部分文本硬编码 |

### 1.2 关键缺陷（必须修复才能使用）

**P0 — 阻断性问题（不修复无法正常使用）：**
1. 又拍云适配器80%未实现（ListObjects/Upload/Download/Delete/Rename全返回error）
2. 七牛云 FetchURL / RefreshCDN / ListDomains 未实现
3. 文件大小显示原始字节数（如 `1048576` 而非 `1 MB`）
4. 时间戳未格式化
5. 重命名使用 `window.prompt()`——在Tauri WebView中可能不可用
6. 删除操作无确认对话框——误触即删除

**P1 — 严重体验问题：**
7. 所有操作无反馈——上传/删除/重命名成功或失败无toast提示
8. 搜索无防抖——每次按键触发API请求
9. 无加载状态——按钮点击后无loading指示，用户不知是否生效
10. Select组件使用原生HTML——样式与设计系统不一致
11. 无空状态设计——列表为空时一片空白
12. 启动加载画面是纯文本
13. 无批量选择——无法多选文件操作

**P2 — 体验不佳：**
14. 无面包屑导航——深层目录无法快速回到上级
15. 右键菜单未实现（依赖已安装但未使用）
16. 虚拟滚动未集成（依赖已安装但未使用）
17. 无图片预览功能
18. 传输列表无速度/剩余时间显示
19. 设置页面无分组无描述
20. 无键盘快捷键

---

## 二、产品设计原则

### 2.1 核心体验目标

1. **即时反馈**：每个操作都有明确的视觉反馈（toast、loading、动画）
2. **防错设计**：危险操作（删除）必须二次确认，支持撤销
3. **渐进式展示**：先展示结构（骨架屏），再填充数据，避免白屏
4. **高效操作**：批量选择、右键菜单、键盘快捷键减少操作步数
5. **信息密度**：文件大小、时间等信息以人类可读格式展示

### 2.2 设计规范增补

| 维度 | 规范 |
|------|------|
| 动画时长 | 微交互 150ms，页面过渡 200-300ms，弹窗 200ms |
| Toast 位置 | 右下角，最多堆叠3条，自动消失4秒 |
| 对话框 | 居中，带遮罩层(bg-black/40 backdrop-blur-sm) |
| 空状态 | 居中图标 + 标题 + 描述 + 操作按钮 |
| 骨架屏 | 与实际内容布局一致的灰色占位块，带pulse动画 |
| 确认框 | 危险操作使用红色主按钮，需输入确认文本 |

---

## 三、分阶段实施计划

### Phase 1：基础组件库升级 + 关键缺陷修复

> **目标**：让项目"可用"——修复阻断问题，建立可靠的组件基础设施

#### 1.1 引入必要的新依赖

```
新增依赖：
- sonner                    # Toast通知系统
- @radix-ui/react-dialog    # 模态对话框
- @radix-ui/react-select    # 自定义Select
- @radix-ui/react-checkbox  # 自定义Checkbox
- @radix-ui/react-tooltip   # 工具提示
- @radix-ui/react-dropdown-menu  # 下拉菜单
- @radix-ui/react-popover   # 弹出面板
- date-fns                  # 日期格式化（轻量，tree-shakable）
- cmdk                      # 命令面板
```

#### 1.2 基础UI组件重构

| 组件 | 改动 | 涉及文件 |
|------|------|---------|
| Button | 新增 loading 态、size变体(sm/md/lg)、icon-only变体 | `src/components/ui/Button.tsx` |
| Select | 用Radix Select替代原生select | `src/components/ui/Select.tsx`（重写） |
| Checkbox | 用Radix Checkbox替代原生checkbox | `src/components/ui/Checkbox.tsx`（新建） |
| Badge | 新增variant(default/success/warning/danger/info) | `src/components/ui/Badge.tsx` |
| Dialog | 基于Radix Dialog封装确认/表单对话框 | `src/components/ui/Dialog.tsx`（新建） |
| Toast | 集成sonner | `src/components/ui/Toaster.tsx`（新建） |
| Tooltip | 基于Radix Tooltip | `src/components/ui/Tooltip.tsx`（新建） |
| DropdownMenu | 基于Radix DropdownMenu | `src/components/ui/DropdownMenu.tsx`（新建） |
| Skeleton | 加载骨架屏组件 | `src/components/ui/Skeleton.tsx`（新建） |
| EmptyState | 空状态展示组件 | `src/components/ui/EmptyState.tsx`（新建） |
| Spinner | 加载动画 | `src/components/ui/Spinner.tsx`（新建） |
| Breadcrumb | 面包屑导航 | `src/components/ui/Breadcrumb.tsx`（新建） |
| Input | 新增带图标变体、密码可见切换 | `src/components/ui/Input.tsx` |

#### 1.3 工具函数补充

```typescript
// src/lib/format.ts（新建）
formatFileSize(bytes: number): string    // 1024 → "1 KB"
formatDate(date: string): string         // ISO → "2024-01-15 14:30"
formatRelativeTime(date: string): string // → "3分钟前"
```

#### 1.4 全局Toast系统集成

```
涉及文件：
- src/main.tsx              # 挂载 <Toaster />
- src/lib/toast.ts          # 导出 toast.success/error/info 快捷方法
```

#### 1.5 P0缺陷修复

| 缺陷 | 修复方案 | 涉及文件 |
|------|---------|---------|
| 文件大小显示字节数 | 使用 formatFileSize | ResourceTable.tsx, ResourceGrid.tsx |
| 时间未格式化 | 使用 formatRelativeTime | ResourceTable.tsx, TransferList.tsx |
| window.prompt重命名 | 用Dialog组件实现RenameDialog | BucketPage.tsx, 新建RenameDialog.tsx |
| 删除无确认 | 用Dialog组件实现ConfirmDialog | BucketPage.tsx |
| 操作无反馈 | 所有mutation成功/失败触发toast | useCloudApi.ts |

---

### Phase 2：核心页面重构 — 资源浏览器

> **目标**：将最核心的BucketPage打造为高效、美观的文件管理器

#### 2.1 BucketPage 整体重构

**当前问题**：所有逻辑堆在一个600+行的页面组件里，UI粗糙

**重构为模块化架构**：

```
src/pages/BucketPage.tsx（瘦身为容器）
  ├── components/bucket/
  │   ├── BucketSidebar.tsx       # Bucket列表侧边栏
  │   ├── BucketToolbar.tsx       # 工具栏（搜索、视图切换、上传按钮）
  │   ├── BreadcrumbNav.tsx       # 面包屑路径导航
  │   ├── ResourceTable.tsx       # 表格视图（重构）
  │   ├── ResourceGrid.tsx        # 网格视图（重构）
  │   ├── ResourceContextMenu.tsx # 右键菜单
  │   ├── SelectionBar.tsx        # 批量操作工具栏
  │   ├── RenameDialog.tsx        # 重命名对话框
  │   ├── DeleteConfirmDialog.tsx # 删除确认对话框
  │   ├── UploadDialog.tsx        # 上传对话框（拖拽区+进度）
  │   ├── ImagePreview.tsx        # 图片预览
  │   └── UrlDialog.tsx           # URL生成/复制对话框
```

#### 2.2 关键交互升级

**面包屑导航**：
```
☁️ my-bucket / images / 2024 / photos /
点击任意层级可快速跳转，替代当前只能逐级返回的设计
```

**批量选择**：
- 表格每行左侧添加 Checkbox
- Shift+点击 范围选择
- Ctrl/Cmd+A 全选
- 选中后底部浮出操作栏（删除、下载、复制URL）

**右键菜单**（使用已安装的 @radix-ui/react-context-menu）：
```
右键文件：
├── 打开/预览
├── 复制URL
├── 下载
├── 重命名
├── ────────
└── 删除（红色）

右键空白区域：
├── 上传文件
├── 新建文件夹
├── 刷新
└── 粘贴
```

**搜索优化**：
- 300ms 防抖
- 搜索时显示loading指示器
- 支持清除搜索按钮（X图标）

**表格升级**：
- 列头可排序（Key/Size/Updated）
- 操作列收纳为"..."下拉菜单（DropdownMenu）
- hover行高亮
- 选中行高亮

**网格视图升级**：
- 图片文件显示缩略图（通过签名URL加载）
- 非图片文件显示文件类型图标
- 文件名tooltip显示完整名称
- 双击打开/预览

#### 2.3 虚拟滚动集成

```
涉及文件：
- src/components/resource/ResourceTable.tsx
- src/components/resource/ResourceGrid.tsx

使用 @tanstack/react-virtual（已安装）：
- 表格：行虚拟化，仅渲染可见行
- 网格：同时行列虚拟化
- 支持动态行高
```

#### 2.4 拖拽上传优化

```
当前：简单的边框变色
升级为：
- 全屏半透明遮罩层
- 居中大图标 + "拖拽文件到此上传"
- 文件数量预览
- 松手后弹出UploadDialog确认
```

---

### Phase 3：登录页 & 设置页重构 + 传输管理升级

> **目标**：优化所有辅助页面的体验

#### 3.1 LoginPage 重构

**当前问题**：表单验证基础、无连接状态反馈、高级选项不直观

**改进方案**：

```
新布局设计：
┌─────────────────────────────────────────────┐
│  Cloud Pika                                 │
│  ☁️ 多云存储管理                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ 已保存账户   │  │ 添加新账户            │  │
│  │             │  │                      │  │
│  │ ✅ 七牛云    │  │ [选择云厂商 ▼]       │  │
│  │    my-qiniu │  │ [别名             ]  │  │
│  │             │  │ [AccessKey         ]  │  │
│  │ ✅ 阿里OSS  │  │ [SecretKey       🔒] │  │
│  │    ali-prod │  │                      │  │
│  │             │  │ ▸ 高级选项            │  │
│  │             │  │                      │  │
│  │             │  │ [验证并保存]          │  │
│  └─────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────┘
```

**关键改进**：
- 云厂商选择：卡片式选择器（带图标和描述），替代下拉框
- SecretKey：添加显示/隐藏切换按钮（Eye/EyeOff图标）
- 验证按钮：loading态 + 成功/失败动画
- 连接失败：详细的错误诊断信息（网络错误 vs 凭证错误 vs 区域错误）
- 已保存账户：卡片式展示，显示云厂商图标、别名、最后使用时间
- 账户卡片：右上角 MoreVertical 菜单（编辑/删除），替代裸露的Delete按钮
- 点击已保存账户直接进入浏览器

```
涉及文件：
- src/pages/LoginPage.tsx（重构）
- src/components/account/AccountCard.tsx（新建）
- src/components/account/ProviderSelector.tsx（新建）
- src/components/account/AccountForm.tsx（新建）
```

#### 3.2 SettingsPage 重构

**当前问题**：所有设置项平铺，无分组，无描述，原生checkbox

**改进方案**：

```
设置页分组设计：

━━━ 外观 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
主题模式        [跟随系统 ▼]
  根据系统偏好自动切换深色/浅色模式

语言            [中文 ▼]
  界面显示语言

━━━ 存储 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTTPS优先       [✓]
  生成文件链接时优先使用HTTPS协议

默认复制格式    [URL ▼]
  复制文件链接时的格式（URL / Markdown / HTML）

分页加载        [✓]
  大量文件时分页加载，避免一次加载全部

━━━ 安全 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
隐藏删除按钮    [ ]
  隐藏资源列表中的删除按钮，防止误操作

━━━ 关于 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
版本            v0.1.0
开源地址        github.com/...
```

```
涉及文件：
- src/pages/SettingsPage.tsx（重构）
- src/components/settings/SettingsPanel.tsx（重构）
- src/components/settings/SettingsGroup.tsx（新建）
- src/components/settings/SettingsItem.tsx（新建）
```

#### 3.3 TransfersPage 升级

**改进方案**：

```
传输列表每条任务卡片：
┌──────────────────────────────────────────┐
│ ↑ my-bucket/photos/2024/sunset.jpg       │
│   上传中 · 2.4 MB/s · 剩余 12s           │
│   ████████████████░░░░░░  72%    [取消]   │
└──────────────────────────────────────────┘
```

**关键改进**：
- 传输速度计算和显示
- 剩余时间估算
- 状态Badge颜色区分（queued=灰, running=蓝, completed=绿, failed=红, canceled=黄）
- 失败任务显示错误原因和"重试"按钮
- 顶部统计栏：上传中 2 · 排队 5 · 已完成 23 · 失败 1
- 支持清除已完成/失败的历史记录
- 硬编码英文文本国际化

```
涉及文件：
- src/pages/TransfersPage.tsx（重构）
- src/components/transfers/TransferList.tsx（重构）
- src/components/transfers/TransferCard.tsx（新建）
- src/components/transfers/TransferStats.tsx（新建）
- src/stores/useTransferStore.ts（新增速度计算逻辑）
```

---

### Phase 4：启动体验 + 全局交互增强

> **目标**：打磨全局性的交互体验

#### 4.1 启动加载画面

```
当前：<div className="p-8 text-sm">Bootstrapping sidecar...</div>

升级为品牌化启动屏：
┌──────────────────────────────────┐
│                                  │
│         ☁️ Cloud Pika            │
│                                  │
│     ─────────────○               │
│     正在启动服务...               │
│                                  │
└──────────────────────────────────┘
- 带进度条或步骤指示
- 有品牌logo和应用名称
- 启动失败显示错误信息和重试按钮
```

```
涉及文件：
- src/main.tsx（BootstrapScreen组件重构）
- src/components/BootstrapScreen.tsx（新建）
```

#### 4.2 命令面板（Cmd+K）

全局快捷搜索面板，支持：
- 快速切换账户
- 快速切换Bucket
- 搜索文件
- 执行操作（上传、刷新、设置等）

```
涉及文件：
- src/components/CommandPalette.tsx（新建）
- src/App.tsx（注册全局快捷键）
```

#### 4.3 键盘快捷键

| 快捷键 | 操作 |
|--------|------|
| Cmd/Ctrl+K | 命令面板 |
| Cmd/Ctrl+U | 上传文件 |
| Cmd/Ctrl+R | 刷新列表 |
| Cmd/Ctrl+A | 全选 |
| Delete/Backspace | 删除选中 |
| Enter | 打开/进入文件夹 |
| Escape | 取消选择/关闭弹窗 |

#### 4.4 主题切换动画

当前主题切换是瞬间变色，改为：
- CSS `transition` 应用到所有颜色属性
- 0.2s ease-out 过渡

```
涉及文件：
- src/index.css（添加全局过渡规则）
```

#### 4.5 Sidebar 优化

- 折叠/展开功能（可手动折叠为仅图标模式）
- 当前页面指示器动画（滑动条而非背景色变化）
- 底部显示当前账户信息和快速切换入口

```
涉及文件：
- src/components/layout/Sidebar.tsx（重构）
- src/components/layout/AppLayout.tsx（适配折叠状态）
```

#### 4.6 Header 优化

- 移除Header中的账户选择（移到Sidebar底部）
- 保留面包屑导航和操作按钮
- 操作按钮添加Tooltip提示

```
涉及文件：
- src/components/layout/Header.tsx（重构）
```

---

### Phase 5：后端补全 + 高级功能

> **目标**：补全后端缺陷，实现差异化功能

#### 5.1 又拍云适配器完成

```
涉及文件：
- sidecar/internal/storage/upyun/upyun.go

待实现：
- ListObjects（使用又拍云 REST API）
- UploadObject
- DownloadObject
- DeleteObjects
- RenameObject
- FetchURL
- RefreshCDN
```

#### 5.2 七牛云特有功能完成

```
涉及文件：
- sidecar/internal/storage/qiniu/qiniu.go

待实现：
- FetchURL（URL抓取上传）
- RefreshCDN（CDN缓存刷新）
- ListDomains（获取绑定域名列表）
```

#### 5.3 CDN刷新UI

为支持CDN刷新的云厂商，在工具栏添加CDN刷新按钮。

```
涉及文件：
- src/components/bucket/BucketToolbar.tsx
- src/hooks/useCloudApi.ts（新增 refreshCDN mutation）
```

#### 5.4 文件预览功能

```
支持预览的文件类型：
- 图片：jpg/png/gif/webp/svg → 大图查看器（缩放、旋转）
- 文本：txt/json/xml/csv → 代码编辑器样式查看
- Markdown：md → 渲染预览
- 视频：mp4/webm → 播放器（通过签名URL）

涉及文件：
- src/components/preview/PreviewDialog.tsx（新建）
- src/components/preview/ImageViewer.tsx（新建）
- src/components/preview/TextViewer.tsx（新建）
- src/components/preview/VideoPlayer.tsx（新建）
```

#### 5.5 文件夹创建

```
Go后端：新增创建空对象（key以/结尾）的API
前端：在右键菜单和工具栏添加"新建文件夹"选项

涉及文件：
- sidecar/internal/handler/object.go（新增 CreateFolder）
- sidecar/internal/server/router.go（新增路由）
- src/components/bucket/CreateFolderDialog.tsx（新建）
```

#### 5.6 传输系统增强

```
Go后端改进：
- 大文件分片上传（>50MB 自动分片）
- 上传进度精确计算（基于已传字节数）
- 并发上传数限制（默认3，可配置）
- 传输速度计算（滑动窗口平均）

涉及文件：
- sidecar/internal/queue/manager.go（重构）
- sidecar/internal/storage/s3compat/s3.go（分片上传）
- sidecar/internal/handler/transfer.go（速度统计）
```

---

### Phase 6：国际化完善 + 最终打磨

> **目标**：打磨细节，确保双语完整

#### 6.1 国际化完善

- 检查所有硬编码文本（TransfersPage有英文硬编码）
- 补全所有新增组件的i18n key
- 日期格式本地化（中文用"3分钟前"，英文用"3 minutes ago"）
- 错误消息国际化

```
涉及文件：
- src/i18n/i18n.ts（大量新增翻译key）
- 所有新建/重构的组件
```

#### 6.2 动画与微交互

```
全局补充：
- Button hover: scale(1.02) + brightness提升
- Button active: scale(0.98)
- Card hover: translateY(-1px) + 阴影增强
- 列表项进入: fadeIn + translateY
- 对话框: fadeIn + scale(0.95→1)
- Toast: slideIn from right
- 骨架屏: pulse动画
- 进度条: 活跃时有shimmer光效
```

#### 6.3 错误边界

```
涉及文件：
- src/components/ErrorBoundary.tsx（新建）
- src/App.tsx（包裹错误边界）

功能：
- 捕获React渲染错误
- 显示友好的错误页面
- 提供"刷新"和"返回首页"按钮
```

#### 6.4 响应式适配

```
确保所有页面在以下尺寸正常显示：
- 最小窗口：800x600
- 默认窗口：1280x820
- 大屏：1920x1080+

关键适配点：
- Sidebar 可折叠
- 表格列自适应隐藏（小窗口隐藏MIME列）
- 网格视图列数自适应
- 对话框宽度自适应
```

---

## 四、新建文件清单

```
src/components/ui/
  ├── Checkbox.tsx          # Radix Checkbox
  ├── Dialog.tsx            # Radix Dialog 封装
  ├── Toaster.tsx           # Sonner Toast
  ├── Tooltip.tsx           # Radix Tooltip
  ├── DropdownMenu.tsx      # Radix DropdownMenu
  ├── Skeleton.tsx          # 骨架屏
  ├── EmptyState.tsx        # 空状态
  ├── Spinner.tsx           # 加载指示器
  └── Breadcrumb.tsx        # 面包屑导航

src/components/bucket/
  ├── BucketSidebar.tsx     # Bucket列表侧栏
  ├── BucketToolbar.tsx     # 工具栏
  ├── BreadcrumbNav.tsx     # 路径导航
  ├── ResourceContextMenu.tsx # 右键菜单
  ├── SelectionBar.tsx      # 批量操作栏
  ├── RenameDialog.tsx      # 重命名对话框
  ├── DeleteConfirmDialog.tsx # 删除确认
  ├── UploadDialog.tsx      # 上传对话框
  ├── UrlDialog.tsx         # URL对话框
  └── CreateFolderDialog.tsx # 新建文件夹

src/components/account/
  ├── AccountCard.tsx       # 账户卡片
  ├── ProviderSelector.tsx  # 云厂商选择器
  └── AccountForm.tsx       # 账户表单

src/components/settings/
  ├── SettingsGroup.tsx     # 设置分组
  └── SettingsItem.tsx      # 设置项

src/components/transfers/
  ├── TransferCard.tsx      # 传输任务卡片
  └── TransferStats.tsx     # 传输统计

src/components/preview/
  ├── PreviewDialog.tsx     # 预览对话框
  ├── ImageViewer.tsx       # 图片查看器
  ├── TextViewer.tsx        # 文本查看器
  └── VideoPlayer.tsx       # 视频播放器

src/components/
  ├── BootstrapScreen.tsx   # 启动画面
  ├── CommandPalette.tsx    # 命令面板
  └── ErrorBoundary.tsx     # 错误边界

src/lib/
  ├── format.ts             # 格式化工具
  └── toast.ts              # Toast快捷方法
```

---

## 五、需重构的现有文件

```
重构（大幅改动）：
- src/pages/BucketPage.tsx        # 拆分为模块化架构
- src/pages/LoginPage.tsx         # 重新设计布局和交互
- src/pages/SettingsPage.tsx      # 分组设计
- src/pages/TransfersPage.tsx     # 统计栏+卡片化
- src/components/ui/Select.tsx    # Radix Select替代原生
- src/components/ui/Button.tsx    # 新增loading/size变体
- src/components/ui/Badge.tsx     # 新增颜色variant
- src/components/resource/ResourceTable.tsx  # 虚拟滚动+选择+排序
- src/components/resource/ResourceGrid.tsx   # 虚拟滚动+缩略图
- src/components/resource/ResourceFilter.tsx # 防抖+清除
- src/components/transfers/TransferList.tsx  # 速度+重试
- src/components/settings/SettingsPanel.tsx  # 分组
- src/components/layout/Sidebar.tsx          # 折叠+账户
- src/components/layout/Header.tsx           # 精简
- src/main.tsx                    # 启动画面+Toast挂载
- src/hooks/useCloudApi.ts        # 新增mutation+toast反馈
- src/index.css                   # 过渡动画+新组件样式
- src/i18n/i18n.ts                # 大量新增翻译

小幅改动：
- src/App.tsx                     # 快捷键注册+错误边界
- src/components/layout/AppLayout.tsx  # Sidebar折叠适配
- src/components/ui/Input.tsx     # 密码显示切换
- src/components/ui/Card.tsx      # hover效果
- src/stores/useTransferStore.ts  # 速度计算
- src/lib/api-client.ts           # 新增API方法

Go后端：
- sidecar/internal/storage/upyun/upyun.go     # 完成适配器
- sidecar/internal/storage/qiniu/qiniu.go      # 完成特有功能
- sidecar/internal/queue/manager.go            # 并发控制+分片
- sidecar/internal/storage/s3compat/s3.go      # 分片上传
- sidecar/internal/handler/object.go           # 新增CreateFolder
- sidecar/internal/handler/transfer.go         # 速度统计
- sidecar/internal/server/router.go            # 新增路由
```

---

## 六、验证方案

### 每个Phase的验证标准

**Phase 1 验证**：
- [ ] 所有新UI组件有正确的深色/浅色主题表现
- [ ] Toast在操作成功/失败时正确显示
- [ ] 文件大小和时间显示为人类可读格式
- [ ] 重命名使用Dialog而非prompt
- [ ] 删除操作弹出确认框

**Phase 2 验证**：
- [ ] 面包屑导航可正确跳转到任意层级
- [ ] 批量选择+Shift范围选择工作正常
- [ ] 右键菜单在文件和空白区域显示不同选项
- [ ] 搜索有300ms防抖，不会触发过多请求
- [ ] 表格列头点击可排序
- [ ] 虚拟滚动在1000+文件时仍然流畅
- [ ] 拖拽上传显示优雅的遮罩层

**Phase 3 验证**：
- [ ] 新账户表单验证完整，错误提示清晰
- [ ] 设置页面分组展示，每项有描述
- [ ] 传输列表显示速度和剩余时间
- [ ] 失败任务可重试

**Phase 4 验证**：
- [ ] 启动画面有品牌标识和进度指示
- [ ] Cmd+K呼出命令面板
- [ ] 主题切换有过渡动画
- [ ] Sidebar可折叠/展开

**Phase 5 验证**：
- [ ] 又拍云所有操作可正常使用
- [ ] 七牛云CDN刷新功能可用
- [ ] 图片文件可预览、缩放
- [ ] 可创建文件夹
- [ ] 大文件（>50MB）自动分片上传

**Phase 6 验证**：
- [ ] 切换到英文后所有文本正确显示英文
- [ ] 深色模式下所有组件颜色和对比度正确
- [ ] 窗口缩小到800x600时界面仍可正常使用
- [ ] 运行 `npm run build` 无TypeScript错误
- [ ] 运行 `make build` 可成功打包

---

## 七、执行优先级建议

```
推荐执行顺序（一个Phase完成后再开始下一个）：

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
基础组件    核心页面    辅助页面    全局交互    后端补全    打磨发布

理由：
- Phase 1 建立组件基础设施，后续所有Phase都依赖它
- Phase 2 是用户停留时间最长的页面，优先打磨
- Phase 3 优化辅助流程
- Phase 4 增强全局体验
- Phase 5 补全功能
- Phase 6 最终打磨
```
