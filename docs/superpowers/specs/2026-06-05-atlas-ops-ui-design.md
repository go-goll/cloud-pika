# Atlas Ops UI 全面改造设计

- 日期：2026-06-05
- 范围：cloud-pika 前端（Wails v3 + React 18 + Tailwind）整体 UI 方向重构
- 参考：`docs/atlas-ops-ui-design-spec.md`、`docs/atlas-ops-ui-prototype/`
- 当前状态：核心应用壳层与 Bucket 工作台第一阶段已落地；Windows 实机、深层组件精修与全局规则更新待继续。

## 1. 背景与目标

当前前端采用 "Cirrus Ether" 玻璃态设计（毛玻璃顶栏、`rounded-3xl` Bento 卡片、主色辉光阴影、12px 圆角）。Atlas Ops 是新的、唯一的设计方向：面向开发者/运维的**高密度多云对象存储工作台**，强调扫描效率、批量操作效率、跨平台一致性与深浅主题质量。规范明确"不再保留其他视觉方案"，禁止营销式 hero、漂浮大卡片、卡片套卡片、毛玻璃装饰。

本次为**完整架构重构**：引入四区布局（自绘标题栏 + 侧栏 + 中央工作区 + 右侧常驻检查器），两平台标题栏均实现，右侧检查器接管传输队列与 Bucket 治理摘要。

## 2. 已确认决策

1. 改造深度：**完整架构重构**（四区布局）。
2. 标题栏：**macOS + Windows 两平台都实现**，基于运行时平台检测；Windows 窗口按钮接 Wails Window API，需同步调整 `main.go` frameless 配置。Windows 实机效果由用户后续在 Windows 验证。
3. 右侧检查器：**检查器为主，抽屉作详情**。传输队列常驻检查器并删除底部 `TransferPanel`；Bucket 治理关键状态常驻检查器，"管理"按钮打开现有 `BucketSettingsDrawer` 调详细参数。
4. 全局规则：**一并更新** `~/.claude/rules/ui-rules.md` 为 Atlas Ops 规范。
5. 搜索：**双搜索共存，职责分开**。标题栏 `⌘K` = 全局命令/跳转（接现有 `CommandPalette`）；工具栏保留当前目录对象过滤搜索框。

## 3. 实现策略（方案 A）

保持现有语义 CSS 变量名（`--bg`/`--accent`…）与 `data-theme` 切换机制不变，**只替换变量值**为 Atlas 调色板。Tailwind 已映射到这些变量，故全部现有组件自动换肤。在此之上新建少量 Atlas 布局壳层组件，并重构 `AppLayout` 为四区 grid。现有页面组件（`ResourceTable`/`Dialog` 等）靠令牌自动换肤 + 局部密度/圆角微调。

不采用平行 `--atlas-*` 令牌（双轨割裂、违反"唯一方向"），不采用仅局部套壳（与四区重构矛盾）。

## 4. 设计令牌层

> 状态：已完成。`index.css` 已替换 Atlas Ops 浅/深色令牌，`tailwind.config.ts` 已调整圆角/阴影，旧 `glass`/`bento-card`/`gradient-primary` 等视觉工具类在 `frontend/src` 中已清理。

### 4.1 `index.css` 根令牌值替换（变量名不变）

| 变量 | 用途 | Light 旧→新 | Dark 旧→新 |
| --- | --- | --- | --- |
| `--bg` | 全局画布 | `#F7F9FB` → `#eef3f7` | `#0C0E12` → `#0d1115` |
| `--bg-card` | 卡片/面板前景(=atlas panel) | `#FFFFFF` → `#fbfcfd` | `#1A1D23` → `#171c22` |
| `--bg-raised` | 分组/输入底(=atlas panel-2) | `#EFF2F5` → `#e4ecf2` | `#14171C` → `#202832` |
| `--border` | 幽灵线 | `rgba(172,179,183,.15)` → `rgba(34,52,63,0.14)` | `rgba(255,255,255,.08)` → `rgba(218,230,236,0.12)` |
| `--text` | 正文 | `#2C3437` → `#17222b` | `#E8EAED` → `#edf3f7` |
| `--text-secondary` | 弱文本 | `#6B7680` → `#62717d` | `#8B9098` → `#96a5af` |
| `--accent` | 主强调 | `#007AFF` → `#0b74e5` | `#3B8AFF` → `#5aa2ff` |
| `--accent-2`（新增） | 次强调(进度/链路) | — `#18a0a6` | — `#36d0b2` |
| `--warning` | 警告 | `#f59e0b` → `#d27816` | `#fbbf24` → `#ffbd5a` |
| `--success` | 成功 | `#16a34a` → `#0e9f6e` | `#22c55e` → `#4fd18b` |
| `--radius` | 圆角 | `12px` → `8px` | 同 |

`--accent-soft` 同步按新 accent 重算（light `rgba(11,116,229,0.08)`，dark `rgba(90,162,255,0.14)`）。`--danger` 保持。新增状态软背景 `--warn-soft`/`--good-soft`（深色提高透明度保证可读）。深色阴影更克制，主要依赖边框与面板层级。

### 4.2 工具类与 Tailwind 调整

- 删除/改写 `.glass`、`.glass-panel`、`.bento-card`、`.gradient-primary`、`.signature-gradient`、`.animate-gradient`、`.animate-breathe` 等营销态工具类。
- 新增 `.atlas-panel`：`background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius);`。
- `tailwind.config.ts`：`borderRadius.DEFAULT` 12px→8px，移除 `bento`/`soft` 容器级大圆角与 `glow`/`ambient` 阴影（保留必要的浮层阴影 token，弹窗用）。
- 文件类型图标颜色保留（与密度无关）。

## 5. 四区布局

> 状态：已完成核心布局。`AppLayout` 已改为标题栏 / 侧栏 / 中央工作区 / 右侧检查器四区 grid；`1280×820` 与 `960×680` 已用浏览器验证无横向溢出，`<1200px` 右侧检查器会隐藏。

```
┌ AppTitlebar  48px(mac)/52px(win) · 拖拽区 · ⌘K命令 · 主题/语言/通知/设置 ┐
├ Sidebar 224px ─┬ Main minmax(0,1fr) ───────────┬ Inspector 252–320px ───┤
│ 品牌            │ H2 标题 + 治理健康入口          │ 当前 Bucket 治理摘要     │
│ 主导航          │ 4 指标条                       │ 传输队列                 │
│ Bucket 列表     │ 面包屑 + 工具栏                 │ 快速动作                 │
│ 当前账户状态     │ 对象表格                       │                         │
└────────────────┴───────────────────────────────┴─────────────────────────┘
```

- 外层 `AppLayout` 改为 CSS grid（行：标题栏 / 主体；主体列：侧栏 / 中央 / 检查器），全部可压缩列用 `minmax(0,1fr)`，文本容器 `min-width:0`。
- 响应式：`<1200px` 隐藏右侧检查器；`<720px` 隐藏侧栏、对象表格转移动卡片式；工具栏按钮组允许内部横向滚动，禁止页面级横向滚动。
- 固定侧栏显式扣除宽度，避免 Windows 最小窗口横向滚动。

## 6. 组件设计

### 6.1 AppTitlebar（新增，替换现有 Header）

> 状态：已完成前端实现。已新增 `AppTitlebar`，迁移主题/语言/账户入口，接入 `⌘K`/`Ctrl K` 命令入口；Windows 按钮已接 Wails Window API。待 Windows 实机确认 frameless/拖拽体验。

- 平台检测：优先后端注入/`@wailsio/runtime`，回退 `navigator.userAgent`，结果置于布局根 class（`platform--mac`/`platform--win`）。
- macOS：左侧为交通灯避让占位（系统已绘，`main.go` 已设 `InvisibleTitleBarHeight:50`、`MacTitleBarHiddenInset`）；命令入口居中偏左；右侧图标操作（主题/语言/通知/设置）。
- Windows：左侧 logo + `Cloud Pika`；右侧最小化/最大化/关闭，接 Wails Window API（关闭 hover 红 `#c42b1c`）；命令入口避开右侧窗口控件。
- 拖拽区使用 Wails draggable，所有按钮标记 no-drag，最小点击 32px。
- 命令入口点击触发现有 `CommandPalette`（复用，不新建搜索）。
- 主题/语言切换逻辑从现有 `Header` 迁移保留。

### 6.2 MetricsBar（新增）

> 状态：已完成第一版。已新增 `MetricsBar`，展示当前 Bucket、可见对象、可见容量、活动队列数；缺失数据降级为 `-`。

四指标卡（对象 / 存储 / CDN / 队列），数字 17–18px：
- 对象：当前 bucket 已加载对象数（`objects.length`，分页场景标注"已加载"）。
- 存储：bucket 容量统计若 provider 可得则显示，否则降级 `—`。
- CDN：基于 provider feature（有 refreshCDN 能力显示 Healthy，否则 `—`）。
- 队列：活动传输数（`useTransferStore` 中 queued+running）。
- 数据缺失一律优雅降级为 `—`，不留空、不报错。

### 6.3 工具栏与面包屑

> 状态：部分完成。`BucketToolbar` 已移除旧渐变视觉并统一 8px 圆角、保留对象过滤搜索与上传/刷新/视图切换；`BreadcrumbNav` 尚未单独精修。

- `BreadcrumbNav` 改 Atlas 样式（账户/Bucket/路径，单行截断）。
- `BucketToolbar` 改造：左保留对象过滤搜索框；右为视图切换 / 排序 / 刷新（图标按钮 32×32）/ 上传（主按钮，蓝底白字）。危险操作不常驻。

### 6.4 ResourceTable

> 状态：待继续。现有表格逻辑保留并随 Atlas tokens 自动换肤，但状态列、行高密度与表格细节 polish 尚未完整实施。

- 行高 42–44px（现 `py-3.5`≈调整），表格容器 8px 圆角、行无圆角。
- 新增"状态"列（小胶囊）：基于对象属性推导（如目录/公开/私有/CDN 状态）；成功用 `--good`，警告用 `--warn`。无法判定时显示中性标签。
- 文件名与 meta 单行截断；hover 轻染（不位移），选中态用强调色淡背景 + 可区分于 hover 的边框；focus-visible 明显。
- 现有虚拟滚动、排序、右键菜单、行操作菜单逻辑保留。

### 6.5 AppInspector（新增）

> 状态：已完成第一版。已新增 `AppInspector`，包含当前 Bucket 摘要、治理摘要、传输队列、选中对象快速动作；底部 `TransferPanel` 已从 `AppLayout` 移除挂载。治理摘要目前为 UI 摘要层，后续可继续接真实配置状态。

三段式：
1. 当前 Bucket：治理摘要只读卡（Versioning / HTTPS / Lifecycle / 公开策略，来自 `useProviderFeaturesQuery` 与 bucket 配置），底部"管理"按钮打开 `BucketSettingsDrawer`。
2. 传输队列：复用 `useTransferStore`，进度条高 6px；**移除 `AppLayout` 中底部 `TransferPanel`**（组件文件可保留待清理，但不再挂载）。
3. 快速动作（高 32px）：批量复制 URL / CDN 刷新 / 下载选中；无选中时禁用并提示。

### 6.6 状态共享（关键架构变更）

> 状态：已完成。`selectedKeys` 已从 `BucketPage` 本地 state 提升到 `useBucketStore`；Inspector 通过 `CustomEvent` 调用现有批量复制、下载、CDN 刷新、删除逻辑；`SelectionBar` 保留为窄屏/即时反馈入口。

检查器位于 `AppLayout` 层，而批量逻辑当前在 `BucketPage`。方案：
- 将 `selectedKeys`（选中态）从 `BucketPage` 本地 state 提升到 `useBucketStore`，供 Inspector 读取以显示选中数、启用/禁用快速动作。`BucketPage` 改为从 store 读写。
- 快速动作的执行复用项目既有 `window CustomEvent` 通信模式（如现有 `cloud-pika:upload-active`），新增 `cloud-pika:batch-copy-url` / `cloud-pika:batch-refresh-cdn` / `cloud-pika:batch-download`；`BucketPage` 监听并调用已实现的批量函数。耦合低、与现有模式一致。
- `SelectionBar` 浮动栏与检查器快速动作功能重叠：保留检查器为主入口，`SelectionBar` 是否保留在实现阶段评估（倾向保留作为表格内即时反馈，复用同一批量函数）。

### 6.7 Dialog / Drawer / Form 密度统一

> 状态：部分完成。基础 `Button`/`Card`/`Input`/`Select` 与启动页已做 Atlas 圆角和视觉语言兼容；`AccountDialog`、`SettingsDrawer`、`BucketSettingsDrawer` 等深层表单/抽屉尚未逐个精修。

`AccountDialog`/`SettingsDrawer`/`BucketSettingsDrawer` 及 `ui/` 基础组件统一：按钮/输入 32px、面板 8px、去玻璃营销感、focus 环明显。模态遮罩保留轻量。

## 7. i18n

> 状态：已完成本阶段新增文案。已补齐 `titlebar.*`、`metrics.*`、`inspector.*` 中英双语；后续新增真实治理状态文案时再扩展。

`src/i18n/i18n.ts` 新增 `titlebar.*`（命令占位、窗口控件 aria）、`inspector.*`（治理摘要、队列、快速动作、管理）、`metrics.*`（对象/存储/CDN/队列及 hint），中英双语同步。中英切换后按钮/标签不溢出。

## 8. main.go

> 状态：待确认。窗口尺寸要求已沿用项目现状；Windows frameless 与窗口行为仍需结合 Go 侧配置和 Windows 实机复核。

新增 Windows 窗口 frameless 配置（自绘标题栏 + 按钮），保持 macOS 现有 `MacTitleBarHiddenInset` 配置不变；窗口尺寸 1280×820 / 最小 960×680 保持。

## 9. 全局规则更新

> 状态：未完成。`~/.claude/rules/ui-rules.md` 位于当前项目工作区外，本次未修改。

重写 `~/.claude/rules/ui-rules.md`：由 "Cirrus Ether 玻璃态" 改为 "Atlas Ops 高密度工作台"（8px 圆角、冷调工作台、双主题、四区布局、禁营销态），与 `docs/atlas-ops-ui-design-spec.md` 保持一致。

## 10. 落地分阶段（按规范 §13）

- [x] 1. 令牌层：`index.css` + `tailwind.config.ts` 替换 + 清理玻璃态工具类。
- [x] 2. 布局骨架 + `AppTitlebar`（两平台前端实现）。
- [~] 3. 中央工作区：`MetricsBar` + 面包屑/工具栏 + `ResourceTable` 状态列与密度。已完成 `MetricsBar` 与工具栏基础视觉；面包屑、表格状态列和密度 polish 待继续。
- [x] 4. 右侧检查器 `AppInspector` + `selectedKeys` 提升 store + 批量事件 + 移除底部面板。
- [~] 5. Dialog/Drawer/Form 密度统一。基础 UI 组件已兼容，深层对话框/抽屉待继续。
- [~] 6. `main.go` Windows frameless + i18n 补齐 + 动效/细节 polish。i18n 已补齐本阶段文案；Windows Go 侧/实机验证与细节 polish 待继续。
- [ ] 7. 全局 `ui-rules.md` 更新。

每阶段单独验证，保证 `vitest` 现有测试通过。

## 11. 验收清单（规范 §14）

`1280×820` 与 `960×680` 两尺寸 × 深/浅主题 × macOS/Windows 标题栏共 8 组合，逐项检查：无页面级横向滚动、标题栏按钮不遮挡命令搜索、Windows 窗口按钮区独立、表格主要列可读、深色对比度足够、中英切换不溢出、125% 缩放工具栏不重叠。macOS 组合在本机验证；Windows 组合提供实现并由用户实机复核。

当前已验证：

- [x] `npm run build` 通过。
- [x] 浏览器 `1280×820`：三列布局正常，无页面级横向滚动。
- [x] 浏览器 `960×680`：Inspector 自动隐藏，主区正常，无页面级横向滚动。
- [x] `/designs` 原型验证页仍可访问。
- [ ] 深/浅主题 × macOS/Windows 共 8 组合完整视觉验收。
- [ ] Windows 实机标题栏与 frameless 行为复核。
- [ ] 125% 缩放与中英文长文案完整走查。

## 12. 风险与缓解

- **Windows 标题栏无法本机验证**：严格按 Wails Window API 实现并隔离平台分支，交付后由用户实机复核。
- **玻璃态残留**：全局搜索 `glass`/`bento`/`gradient`/`backdrop-blur` 等关键字逐一清理，防止视觉割裂。
- **状态提升回归**：`selectedKeys` 迁移 store 可能影响键盘导航/Shift 范围选择，迁移后跑现有 `useKeyboardNavigation` 测试与手动验证。
- **现有测试**：`BucketSettingsDrawer`/`TransferCard`/`TextPreview` 等测试在密度改造后需保持通过，必要时同步更新断言。

## 13. 不在本次范围（YAGNI）

- 不新增云厂商/不改后端 API/不改业务数据流。
- 不做与 Atlas 无关的重构。
- `DesignShowcasePage`（`/designs` 原型预览）保留作为多尺寸/主题验证工具，不投入额外美化。
