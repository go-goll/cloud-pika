# Atlas Ops UI 改造 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 cloud-pika 前端从 Cirrus Ether 玻璃态整体重构为 Atlas Ops 高密度四区工作台，两平台标题栏、右侧常驻检查器、深浅双主题。

**Architecture:** 保持语义 CSS 变量名与 `data-theme` 机制不变，原地替换令牌值让现有组件自动换肤；新建标题栏/指标条/检查器壳层组件，`AppLayout` 重构为四区 CSS grid；选中态提升至 `useBucketStore`，检查器快速动作经 `window CustomEvent` 触发 `BucketPage` 既有批量函数。

**Tech Stack:** React 18 + TypeScript + Tailwind 3 + Zustand + Wails v3 + Vitest + lucide-react。

**参考：** 设计规范 `docs/atlas-ops-ui-design-spec.md`；spec `docs/superpowers/specs/2026-06-05-atlas-ops-ui-design.md`；原型 `docs/atlas-ops-ui-prototype/`。

**提交粒度与规则：** 本项目规则要求每次 commit 前先执行代码审查（`/local-review`）。因此**按阶段提交**（非每任务），每阶段末跑一次 `npm run build` + `npm run test:run` + `/local-review`，通过后提交。所有命令在 `frontend/` 下运行（除 Go 任务）。

---

## 文件结构

**新建：**
- `frontend/src/lib/platform.ts` — 运行时平台检测（纯函数，可测）
- `frontend/src/lib/window-controls.ts` — Wails 窗口控件适配层（最小化/最大化/关闭）
- `frontend/src/lib/object-status.ts` — 对象状态推导（纯函数，可测）
- `frontend/src/lib/metrics.ts` — 指标计算（纯函数，可测）
- `frontend/src/components/layout/AppTitlebar.tsx` — 跨平台自绘标题栏（替换 `Header`）
- `frontend/src/components/layout/MetricsBar.tsx` — 四指标条
- `frontend/src/components/layout/AppInspector.tsx` — 右侧检查器
- `frontend/src/lib/__tests__/platform.test.ts`
- `frontend/src/lib/__tests__/object-status.test.ts`
- `frontend/src/lib/__tests__/metrics.test.ts`
- `frontend/src/stores/__tests__/useBucketStore.test.ts`

**修改：**
- `frontend/src/index.css` — 令牌值替换 + 清理玻璃态工具类
- `frontend/tailwind.config.ts` — 圆角/阴影令牌
- `frontend/src/components/ui/Button.tsx` — primary 去渐变辉光
- `frontend/src/components/layout/AppLayout.tsx` — 四区 grid + 挂载检查器 + 移除底部 TransferPanel
- `frontend/src/components/bucket/BreadcrumbNav.tsx` — Atlas 样式
- `frontend/src/components/bucket/BucketToolbar.tsx` — Atlas 样式
- `frontend/src/components/resource/ResourceTable.tsx` — 行密度 + 状态列
- `frontend/src/stores/useBucketStore.ts` — 新增 `selectedKeys` 选中态
- `frontend/src/pages/BucketPage.tsx` — 选中态改读 store + 监听批量事件
- `frontend/src/i18n/i18n.ts` — 新增 `titlebar`/`inspector`/`metrics`/`status` 文案
- `main.go` — Windows frameless 窗口配置
- `~/.claude/rules/ui-rules.md` — 改写为 Atlas Ops 规范

---

## 当前执行状态

> 2026-06-05 更新：此前已完成一轮 Atlas Ops 主应用壳层实现，但没有完全按本计划的 task-by-task 顺序补齐纯函数、测试、分支/提交流程。以下 checkbox 只标记已经符合本计划验收口径的步骤；部分完成项保留未勾选，并在任务下用“当前状态”说明。

## 阶段 0：准备

### Task 0：创建特性分支

- [ ] **Step 1：创建并切换分支**

```bash
cd /Users/goll/work/my/cloud-pika
git checkout -b feat/atlas-ops-ui
```

- [ ] **Step 2：确认前端测试基线通过**

Run: `cd frontend && npm run test:run`
Expected: 现有测试全部 PASS（记录基线，后续不得回归）。

---

## 阶段 1：设计令牌层

### Task 1：替换 `index.css` 根令牌并清理玻璃态

**Files:** Modify `frontend/src/index.css`

当前状态：浅/深色 Atlas 令牌已替换，`npm run build` 已通过；营销态工具类已从令牌层移除。`atlas-region` 尚未补充，但当前布局直接使用 `bg-[var(--bg-card)]`/`border-[var(--border)]`。

- [x] **Step 1：替换 `:root`（浅色）令牌值**

把 `:root` 内的核心调色板替换为 Atlas 浅色值，并新增 `--accent-2`、状态软背景：

```css
  /* ── Atlas Ops 浅色调色板 ── */
  --bg:             #eef3f7;
  --bg-raised:      #e4ecf2;
  --bg-card:        #fbfcfd;
  --border:         rgba(34, 52, 63, 0.14);
  --text:           #17222b;
  --text-secondary: #62717d;
  --accent:         #0b74e5;
  --accent-hover:   #095fbe;
  --accent-2:       #18a0a6;
  --accent-soft:    rgba(11, 116, 229, 0.08);
  --accent-text:    #ffffff;
  --danger:         #d24a3f;
  --success:        #0e9f6e;
  --warning:        #d27816;
  --good-soft:      rgba(14, 159, 110, 0.12);
  --warn-soft:      rgba(210, 120, 22, 0.14);
  --radius:         8px;
```

阴影改克制（移除主色辉光，仅保留浮层用）：

```css
  --shadow-xs:  0 1px 2px rgba(20,33,43,0.04);
  --shadow-sm:  0 2px 6px -2px rgba(20,33,43,0.08);
  --shadow-md:  0 8px 24px -6px rgba(20,33,43,0.10);
  --shadow-lg:  0 16px 40px -10px rgba(20,33,43,0.14);
  --shadow-xl:  0 24px 56px -14px rgba(20,33,43,0.18);
```

兼容别名块（`--surface`/`--color-*` 等）保持不变——它们引用上面的变量，无需改。

- [x] **Step 2：替换 `:root[data-theme='dark']` 令牌值**

```css
  --bg:             #0d1115;
  --bg-raised:      #202832;
  --bg-card:        #171c22;
  --border:         rgba(218, 230, 236, 0.12);
  --text:           #edf3f7;
  --text-secondary: #96a5af;
  --accent:         #5aa2ff;
  --accent-hover:   #7cb6ff;
  --accent-2:       #36d0b2;
  --accent-soft:    rgba(90, 162, 255, 0.14);
  --accent-text:    #0d1115;
  --danger:         #ff6b5e;
  --success:        #4fd18b;
  --warning:        #ffbd5a;
  --good-soft:      rgba(79, 209, 139, 0.18);
  --warn-soft:      rgba(255, 189, 90, 0.20);
```

深色阴影同步改克制（去强蓝辉光，参照浅色比例加深 alpha）。

- [x] **Step 3：清理营销态工具类**

删除 `.glass`、`.glass-panel`、`.bento-card`、`.bento-card:hover`、`.gradient-primary`、`.signature-gradient`、`.animate-gradient`、`.animate-breathe`、`@keyframes gradient-shift`、`@keyframes breathe`、`.progress-shimmer` 中的辉光（保留 shimmer 关键帧供骨架屏）。新增 Atlas 面板与色调悬停工具类：

```css
/* Atlas 面板（替代玻璃卡片） */
.atlas-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

/* 标题栏/侧栏区域底（非毛玻璃） */
.atlas-region {
  background: var(--bg-card);
  border-color: var(--border);
}
```

保留 `.tonal-hover`、`.ambient-shadow`（改引用 `--shadow-lg`）、`.ghost-border`、文件图标颜色块、`pageFadeIn`/`rowFadeIn`/`dialogIn`/`slideUp` 动画。

- [x] **Step 4：验证构建**

Run: `cd frontend && npm run build`
Expected: tsc + vite 构建成功（玻璃类删除若有引用会在后续任务处理；本步只要 CSS 合法、构建过）。
> 注：`Button.tsx`/`BucketToolbar.tsx`/`TransferPanel.tsx` 仍引用 `gradient-primary`/`glass`，会在 Task 2、9、14 改掉；删除工具类后这些 class 仅失效不报错，构建仍通过。

### Task 2：Tailwind 圆角/阴影令牌 + Button 去辉光

**Files:** Modify `frontend/tailwind.config.ts`、`frontend/src/components/ui/Button.tsx`

当前状态：Tailwind 与 Button 已改为 Atlas 方向；`npm run build` 与 `npm run test:run` 已通过。本阶段尚未按计划提交。

- [x] **Step 1：调整 `tailwind.config.ts` borderRadius 与 boxShadow**

```ts
      borderRadius: {
        DEFAULT: '8px',
        soft: '10px',
      },
      boxShadow: {
        ambient: '0 16px 40px -10px rgba(20,33,43,0.14)',
      },
```

移除 `bento` 圆角与 `glow-sm`/`glow` 阴影键。

- [x] **Step 2：Button primary 改纯色（去渐变辉光）**

把 `variantClasses.primary` 改为：

```ts
  primary: [
    'bg-[var(--accent)] text-[var(--accent-text)]',
    'hover:bg-[var(--accent-hover)]',
    'active:scale-[0.98]',
  ].join(' '),
```

并把基础类里的 `rounded-xl` 改为 `rounded-[8px]`（容器级 8px）。

- [x] **Step 3：验证构建 + 现有测试**

Run: `cd frontend && npm run build && npm run test:run`
Expected: 构建成功，测试全 PASS。

- [ ] **Step 4：阶段提交（先审查）**

```bash
cd /Users/goll/work/my/cloud-pika
# 执行 /local-review 审查本阶段改动，通过后：
git add frontend/src/index.css frontend/tailwind.config.ts frontend/src/components/ui/Button.tsx
git commit -m "style(ui): 切换设计令牌为 Atlas Ops 调色板并清理玻璃态"
```

---

## 阶段 2：布局骨架 + 跨平台标题栏

### Task 3：平台检测纯函数

**Files:** Create `frontend/src/lib/platform.ts`、`frontend/src/lib/__tests__/platform.test.ts`

当前状态：已创建 `platform.ts` 与测试，定向测试和全量测试均通过。

- [x] **Step 1：写失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { detectPlatform } from '@/lib/platform';

describe('detectPlatform', () => {
  it('识别 macOS', () => {
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe('mac');
  });
  it('识别 Windows', () => {
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0)')).toBe('win');
  });
  it('其它平台回退 other', () => {
    expect(detectPlatform('Mozilla/5.0 (X11; Linux x86_64)')).toBe('other');
  });
});
```

- [x] **Step 2：运行确认失败**

Run: `cd frontend && npx vitest run src/lib/__tests__/platform.test.ts`
Expected: FAIL（模块不存在）。

- [x] **Step 3：实现**

```ts
export type Platform = 'mac' | 'win' | 'other';

/** 基于 userAgent 检测运行平台，用于标题栏控件分支。 */
export function detectPlatform(
  ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : '',
): Platform {
  if (/Mac|iPhone|iPad|iPod/.test(ua)) return 'mac';
  if (/Win/.test(ua)) return 'win';
  return 'other';
}
```

- [x] **Step 4：运行确认通过**

Run: `cd frontend && npx vitest run src/lib/__tests__/platform.test.ts`
Expected: PASS。

### Task 4：窗口控件适配层

**Files:** Create `frontend/src/lib/window-controls.ts`

当前状态：已创建 `window-controls.ts`，`AppTitlebar` 已改为通过适配层调用 Wails Window API。

- [x] **Step 1：实现适配层（集中封装，便于实机微调）**

```ts
import { Window } from '@wailsio/runtime';

/**
 * Windows 自绘标题栏的窗口控件适配层。
 * Wails v3 alpha 的方法命名若与实机不符，只需在此单文件调整。
 */
export const windowControls = {
  minimise: () => {
    void Window.Minimise?.();
  },
  toggleMaximise: () => {
    void Window.ToggleMaximise?.();
  },
  close: () => {
    void Window.Close?.();
  },
};
```

- [x] **Step 2：验证构建**

Run: `cd frontend && npm run build`
Expected: 构建成功（`@wailsio/runtime` 已是依赖）。
> 若 `Window` 导出名不符，改为从 runtime 实际导出引入；可选链保证调用安全。

### Task 5：AppTitlebar 组件

**Files:** Create `frontend/src/components/layout/AppTitlebar.tsx`

当前状态：已创建 `AppTitlebar`，接入主题/语言/设置/账户、`detectPlatform()`、`windowControls`、Wails drag/no-drag style，并统一命令事件为 `cloud-pika:open-command`。

- [x] **Step 1：实现标题栏（迁移 Header 的主题/语言/设置/账户逻辑）**

要点（完整实现，复用现有 store 与对话框）：
- 顶层 `<header>` 高度 macOS 48px / Windows 52px，`bg-[var(--bg-card)]` 底、底部 `border-b border-[var(--border)]`。
- 整条标记 Wails 可拖拽：根元素加 `style={{ ['--wails-draggable' as string]: 'drag' }}`，所有 `<button>` 加 `style={{ ['--wails-draggable' as string]: 'no-drag' }}`。
- 网格：mac = `[交通灯避让 64px][命令入口 minmax(220px,520px)][1fr 右侧操作]`；win = `[logo+名称][命令入口][1fr 右侧操作][窗口控件 auto]`。
- 命令入口：按钮，左 `Search` 图标 + 占位文案 `t('titlebar.commandPlaceholder')` + `<kbd>` 显示 `⌘K`(mac)/`Ctrl K`(win)，点击 `window.dispatchEvent(new Event('cloud-pika:open-command'))`。
- 右侧操作（图标按钮 32×32）：主题切换、语言切换、设置（迁移自 `Header.tsx` 现有 handler：`handleToggleTheme`/`handleToggleLanguage`、`setSettingsOpen`），账户头像按钮（`setAccountDialogOpen(true)`）。
- Windows 窗口控件：最小化 `windowControls.minimise`、最大化 `windowControls.toggleMaximise`、关闭 `windowControls.close`（关闭 hover `bg-[#c42b1c] text-white`）。
- 平台分支由 `detectPlatform()` 决定，结果存 `const platform = useMemo(() => detectPlatform(), [])`。
- 渲染 `<AccountDialog>` 与 `<SettingsDrawer>`（迁移自 Header）。
- "没有账户自动打开账户对话框" 的 effect 从 Header 迁移过来。

- [x] **Step 2：让 CommandPalette 响应命令事件**

`frontend/src/components/CommandPalette.tsx` 内新增监听（若其已支持 `⌘K` 快捷键则只需补事件入口）：在其打开逻辑中加 `useEffect` 监听 `window` 的 `cloud-pika:open-command` 事件并 `setOpen(true)`。

- [x] **Step 3：验证构建**

Run: `cd frontend && npm run build`
Expected: 成功。

### Task 6：AppLayout 四区 grid 重构

**Files:** Modify `frontend/src/components/layout/AppLayout.tsx`

当前状态：四区 grid、真实 `AppInspector`、移除 `Header`/`TransferPanel` 挂载已完成，并已验证 `1280×820` / `960×680` 无横向溢出；`Sidebar` 仍保留可折叠状态，这是相对计划静态侧栏的实现差异。

- [x] **Step 1：重构为四区 grid**

```tsx
import type { PropsWithChildren } from 'react';
import { AppTitlebar } from './AppTitlebar';
import { Sidebar } from './Sidebar';
import { AppInspector } from './AppInspector';
import { detectPlatform } from '@/lib/platform';

export function AppLayout({ children }: PropsWithChildren) {
  const platform = detectPlatform();
  return (
    <div
      className={`flex h-screen flex-col bg-[var(--bg)] platform--${platform}`}
    >
      <AppTitlebar />
      <div className="grid min-h-0 flex-1 grid-cols-[224px_minmax(0,1fr)_clamp(252px,22vw,320px)] max-[1200px]:grid-cols-[224px_minmax(0,1fr)] max-[720px]:grid-cols-1">
        <Sidebar />
        <main className="min-w-0 overflow-auto p-4">{children}</main>
        <AppInspector />
      </div>
    </div>
  );
}
```

> 本步先引用尚未创建的 `AppInspector`（阶段 4 创建）。为保证阶段 2 可独立构建，**先创建占位 `AppInspector`**：返回 `<aside className="hidden min-[1201px]:block atlas-panel m-2" />`，阶段 4 再填充。
> `Sidebar` 当前是 `fixed` 定位 + 自管宽度；本步改为静态 grid 列：在 Sidebar 中移除 `fixed left-0 top-0`/`style width` 与折叠位移逻辑，改为 `flex h-full flex-col`，宽度由 grid 列控制（折叠按钮逻辑可保留但改为 `<720px` 时隐藏整列）。详见 Step 2。

- [ ] **Step 2：Sidebar 适配静态列**

`frontend/src/components/layout/Sidebar.tsx`：
- 移除 `fixed left-0 top-0 z-40 h-screen` 与 `style={{ width }}`，根 `<aside>` 改 `className="flex h-full min-h-0 flex-col border-r border-[var(--border)] bg-[var(--bg-card)]"`。
- 移除 `glass`。品牌区/导航/Bucket 列表/账户区保留，圆角统一 `rounded-[8px]`，活跃态 `bg-[var(--accent-soft)] text-[var(--accent)]`。
- 折叠相关 state/resize 监听删除（grid 已处理响应式），底部"折叠切换"按钮移除。

- [ ] **Step 3：创建占位 AppInspector**

```tsx
export function AppInspector() {
  return <aside className="hidden min-[1201px]:block" aria-hidden />;
}
```

- [x] **Step 4：移除旧 Header 引用，验证**

确认 `AppLayout` 不再 import `Header`/`TransferPanel`（TransferPanel 在阶段 4 处理；此处先保留底部不挂载——直接从布局移除）。

Run: `cd frontend && npm run build && npm run test:run`
Expected: 构建成功、测试 PASS。手动 `npm run dev` 在 1280×820 / 960×680 目测：标题栏、侧栏、中央三列正常，无横向滚动。

- [ ] **Step 5：阶段提交（先审查）**

```bash
git add frontend/src/lib/platform.ts frontend/src/lib/window-controls.ts \
  frontend/src/lib/__tests__/platform.test.ts \
  frontend/src/components/layout/AppTitlebar.tsx \
  frontend/src/components/layout/AppLayout.tsx \
  frontend/src/components/layout/Sidebar.tsx \
  frontend/src/components/layout/AppInspector.tsx \
  frontend/src/components/CommandPalette.tsx
# /local-review 通过后提交
git commit -m "feat(layout): Atlas 四区布局与跨平台自绘标题栏"
```

---

## 阶段 3：中央工作区

### Task 7：对象状态推导纯函数

**Files:** Create `frontend/src/lib/object-status.ts`、`frontend/src/lib/__tests__/object-status.test.ts`

当前状态：已创建 `object-status.ts` 与测试，`ResourceTable` 状态列已接入。

- [x] **Step 1：写失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { getObjectStatus } from '@/lib/object-status';

describe('getObjectStatus', () => {
  it('目录返回 folder/neutral', () => {
    const s = getObjectStatus({ key: 'a/', size: 0, isDir: true });
    expect(s).toEqual({ labelKey: 'status.folder', tone: 'neutral' });
  });
  it('以斜杠结尾视为目录', () => {
    expect(getObjectStatus({ key: 'a/', size: 0 }).labelKey).toBe('status.folder');
  });
  it('普通文件返回 ready/good', () => {
    const s = getObjectStatus({ key: 'a.png', size: 1 });
    expect(s).toEqual({ labelKey: 'status.ready', tone: 'good' });
  });
});
```

- [x] **Step 2：运行确认失败**

Run: `cd frontend && npx vitest run src/lib/__tests__/object-status.test.ts`
Expected: FAIL。

- [x] **Step 3：实现**

```ts
import type { ObjectItem } from '@/types/cloud';

export type StatusTone = 'good' | 'warn' | 'neutral';

export interface ObjectStatus {
  labelKey: string;
  tone: StatusTone;
}

/**
 * 推导对象状态胶囊。当前对象元数据仅含目录/大小/时间，
 * 因此只做诚实的可得态：目录=Folder，文件=Ready。
 * 后续若拿到公开/CDN 状态，可在此扩展 warn 态。
 */
export function getObjectStatus(item: ObjectItem): ObjectStatus {
  if (item.isDir || item.key.endsWith('/')) {
    return { labelKey: 'status.folder', tone: 'neutral' };
  }
  return { labelKey: 'status.ready', tone: 'good' };
}
```

- [x] **Step 4：运行确认通过**

Run: `cd frontend && npx vitest run src/lib/__tests__/object-status.test.ts`
Expected: PASS。

### Task 8：指标计算 + MetricsBar

**Files:** Create `frontend/src/lib/metrics.ts`、`frontend/src/lib/__tests__/metrics.test.ts`、`frontend/src/components/layout/MetricsBar.tsx`

当前状态：已创建 `metrics.ts` 与测试，`MetricsBar.tsx` 已改为使用 `deriveMetrics`。

- [x] **Step 1：写失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { deriveMetrics } from '@/lib/metrics';

describe('deriveMetrics', () => {
  it('优先用 bucket 统计，缺失降级 —', () => {
    const m = deriveMetrics({
      bucket: { name: 'b', provider: 'qiniu', count: 100, space: 2048 },
      objectsLoaded: 30, activeTransfers: 2, hasCDN: true,
    });
    expect(m.objects).toBe('100');
    expect(m.storage).not.toBe('—');
    expect(m.cdn).toBe('Healthy');
    expect(m.queue).toBe('2');
  });
  it('无 bucket 统计时对象回退已加载数、存储/CDN 降级', () => {
    const m = deriveMetrics({
      bucket: { name: 'b', provider: 'qiniu' },
      objectsLoaded: 30, activeTransfers: 0, hasCDN: false,
    });
    expect(m.objects).toBe('30');
    expect(m.storage).toBe('—');
    expect(m.cdn).toBe('—');
    expect(m.queue).toBe('0');
  });
});
```

- [x] **Step 2：运行确认失败**

Run: `cd frontend && npx vitest run src/lib/__tests__/metrics.test.ts`
Expected: FAIL。

- [x] **Step 3：实现 `metrics.ts`**

```ts
import type { BucketInfo } from '@/types/cloud';
import { formatFileSize } from '@/lib/format';

export interface MetricsInput {
  bucket?: BucketInfo;
  objectsLoaded: number;
  activeTransfers: number;
  hasCDN: boolean;
}

export interface MetricsView {
  objects: string;
  storage: string;
  cdn: string;
  queue: string;
}

/** 计算四指标展示值，缺失数据一律降级为 "—"。 */
export function deriveMetrics(input: MetricsInput): MetricsView {
  const { bucket, objectsLoaded, activeTransfers, hasCDN } = input;
  return {
    objects: String(bucket?.count ?? objectsLoaded),
    storage: bucket?.space != null ? formatFileSize(bucket.space) : '—',
    cdn: hasCDN ? 'Healthy' : '—',
    queue: String(activeTransfers),
  };
}
```

- [x] **Step 4：运行确认通过**

Run: `cd frontend && npx vitest run src/lib/__tests__/metrics.test.ts`
Expected: PASS。

- [x] **Step 5：实现 `MetricsBar.tsx`**

四列 `grid grid-cols-4 gap-2 max-[720px]:grid-cols-2`，每格 `.atlas-panel p-3`：上 label（`text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)]`）、中 value（`text-[17px] font-semibold`）、下 hint（`text-[11px] text-[var(--text-secondary)]`）。props 接收 `MetricsView` + hint 文案 key。label 文案用 `t('metrics.objects')` 等。

- [x] **Step 6：验证构建**

Run: `cd frontend && npm run build`
Expected: 成功。

### Task 9：BreadcrumbNav + BucketToolbar Atlas 样式

**Files:** Modify `frontend/src/components/bucket/BreadcrumbNav.tsx`、`frontend/src/components/bucket/BucketToolbar.tsx`

当前状态：`BucketToolbar` 与 `BreadcrumbNav` 均已做 Atlas 基础样式。

- [x] **Step 1：BreadcrumbNav 改 Atlas 样式**

容器 `flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]`，当前段 `text-[var(--text)] font-medium`，各段单行截断（`truncate min-w-0`）；分隔符用 `/`。保留现有导航回调逻辑。

- [x] **Step 2：BucketToolbar 改 Atlas 样式**

- 搜索框（保留对象过滤）：`Input` 容器 `h-8 rounded-[8px] bg-[var(--bg-raised)]`，去除 `rounded-xl`。
- 视图切换/新建/抓取/设置/刷新：统一 32×32 图标按钮，`rounded-[8px]`，hover `tonal-hover`。
- 上传主按钮：`<Button>`（已在 Task 2 改纯色），去 `gradient-primary` class，改 `rounded-[8px]`。
- 移除任何 `gradient-primary`/`shadow-sm` 营销样式。

- [x] **Step 3：验证构建 + 测试**

Run: `cd frontend && npm run build && npm run test:run`
Expected: 成功、PASS。

### Task 10：ResourceTable 密度 + 状态列

**Files:** Modify `frontend/src/components/resource/ResourceTable.tsx`

当前状态：已实现状态列、行高调整、状态胶囊与空态 colSpan 更新，并通过构建/测试/浏览器尺寸回归。

- [x] **Step 1：行高与圆角调整**

- 单元格 `py-3.5` → `py-2.5`（行高约 42–44px）；`ROW_HEIGHT` 常量 36 → 42。
- 行容器去 `rounded-xl`；hover 用 `hover:bg-[var(--bg-raised)]`（替换硬编码 `rgba(234,239,242,0.4)`），选中态 `bg-[var(--accent-soft)] ring-1 ring-inset ring-[var(--accent)]/40`，focus 态保留。
- 表头 `bg-[var(--bg)]` 保留 sticky。

- [x] **Step 2：新增"状态"列**

- 表头在"更新时间"与操作列之间插入 `<th>` 状态列（`t('bucket.columnStatus')`，宽约 96px，不可排序）。
- 行内对应 `<td>`：渲染状态胶囊

```tsx
const status = getObjectStatus(item);
// 胶囊：
<span className={[
  'inline-flex items-center justify-center min-w-[64px]',
  'px-2 py-0.5 rounded-full text-[11px] font-semibold',
  status.tone === 'good'
    ? 'bg-[var(--good-soft)] text-[var(--success)]'
    : status.tone === 'warn'
      ? 'bg-[var(--warn-soft)] text-[var(--warning)]'
      : 'bg-[var(--bg-raised)] text-[var(--text-secondary)]',
].join(' ')}>
  {t(status.labelKey)}
</span>
```

- import `getObjectStatus`；空态 `colSpan` 由 5 改为 6。

- [x] **Step 3：验证构建 + 测试 + 目测**

Run: `cd frontend && npm run build && npm run test:run`
Expected: 成功、PASS。`npm run dev` 目测表格行高、状态列、深浅主题胶囊对比度。

- [ ] **Step 4：阶段提交（先审查）**

```bash
git add frontend/src/lib/object-status.ts frontend/src/lib/metrics.ts \
  frontend/src/lib/__tests__/object-status.test.ts frontend/src/lib/__tests__/metrics.test.ts \
  frontend/src/components/layout/MetricsBar.tsx \
  frontend/src/components/bucket/BreadcrumbNav.tsx \
  frontend/src/components/bucket/BucketToolbar.tsx \
  frontend/src/components/resource/ResourceTable.tsx
# /local-review 通过后提交
git commit -m "feat(bucket): Atlas 中央工作区 指标条/工具栏/表格状态列"
```

---

## 阶段 4：右侧检查器 + 选中态提升

### Task 11：useBucketStore 新增选中态

**Files:** Modify `frontend/src/stores/useBucketStore.ts`、Create `frontend/src/stores/__tests__/useBucketStore.test.ts`

当前状态：已按计划改为 `Set<string>`，并补齐 store 测试。

- [x] **Step 1：写失败测试**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useBucketStore } from '@/stores/useBucketStore';

describe('useBucketStore selection', () => {
  beforeEach(() => {
    useBucketStore.getState().setSelectedKeys(new Set());
  });
  it('setSelectedKeys 覆盖选中', () => {
    useBucketStore.getState().setSelectedKeys(new Set(['a', 'b']));
    expect(useBucketStore.getState().selectedKeys.size).toBe(2);
  });
  it('clearSelection 清空', () => {
    useBucketStore.getState().setSelectedKeys(new Set(['a']));
    useBucketStore.getState().clearSelection();
    expect(useBucketStore.getState().selectedKeys.size).toBe(0);
  });
});
```

- [x] **Step 2：运行确认失败**

Run: `cd frontend && npx vitest run src/stores/__tests__/useBucketStore.test.ts`
Expected: FAIL（`setSelectedKeys` 不存在）。

- [x] **Step 3：实现**

在 `BucketState` 接口加：

```ts
  selectedKeys: Set<string>;
  setSelectedKeys: (keys: Set<string>) => void;
  clearSelection: () => void;
```

在 store 实现加（初值 `selectedKeys: new Set()`）：

```ts
      setSelectedKeys: (selectedKeys) => set({ selectedKeys }),
      clearSelection: () => set({ selectedKeys: new Set() }),
```

`reset` 内追加 `selectedKeys: new Set()`。`persist.partialize` 不变（不持久化选中态）。

- [x] **Step 4：运行确认通过**

Run: `cd frontend && npx vitest run src/stores/__tests__/useBucketStore.test.ts`
Expected: PASS。

### Task 12：BucketPage 改用 store 选中态 + 批量事件监听

**Files:** Modify `frontend/src/pages/BucketPage.tsx`

当前状态：已改为从 store 读写选中态，并已监听 Inspector 批量事件；构建、测试与尺寸回归已通过。

- [x] **Step 1：选中态改读 store**

- 删除本地 `const [selectedKeys, setSelectedKeys] = useState(...)`，改为从 `useBucketStore` 取 `selectedKeys`/`setSelectedKeys`/`clearSelection`。
- `handleSelect`/`handleSelectAll` 内的 `setSelectedKeys((prev) => …)` 改为基于 store 当前值计算后 `setSelectedKeys(next)`（store 的 setter 为覆盖式）。读取当前值用 `useBucketStore.getState().selectedKeys` 或把 `selectedKeys` 纳入 useCallback 依赖。
- 各处 `setSelectedKeys(new Set())` 改 `clearSelection()`。

- [x] **Step 2：监听检查器批量事件**

新增 effect，把检查器派发的事件映射到既有批量函数：

```tsx
useEffect(() => {
  const onCopy = () => void handleBatchCopyUrl();
  const onRefresh = () => void handleBatchRefreshCDN();
  const onDownload = () => void handleBatchDownload();
  window.addEventListener('cloud-pika:batch-copy-url', onCopy);
  window.addEventListener('cloud-pika:batch-refresh-cdn', onRefresh);
  window.addEventListener('cloud-pika:batch-download', onDownload);
  return () => {
    window.removeEventListener('cloud-pika:batch-copy-url', onCopy);
    window.removeEventListener('cloud-pika:batch-refresh-cdn', onRefresh);
    window.removeEventListener('cloud-pika:batch-download', onDownload);
  };
}, [handleBatchCopyUrl, handleBatchRefreshCDN, handleBatchDownload]);
```

- [x] **Step 3：验证构建 + 测试 + 目测**

Run: `cd frontend && npm run build && npm run test:run`
Expected: 成功、PASS。`npm run dev` 验证多选、Shift 范围选、全选、删除后清选中仍正常。

### Task 13：AppInspector 实现

**Files:** Modify `frontend/src/components/layout/AppInspector.tsx`

当前状态：已实现三段式检查器，包含 Bucket 摘要、治理摘要、传输队列、快速动作；`open-bucket-settings` 事件已由 `BucketPage` 监听；构建和两个窗口尺寸已验证。治理摘要目前仍是基础摘要，后续可继续接真实 provider/config 状态。

- [x] **Step 1：实现三段式检查器**

`<aside className="hidden min-[1201px]:flex h-full min-h-0 flex-col gap-2 overflow-auto border-l border-[var(--border)] bg-[var(--bg-card)] p-3">`，含三段（各为 `.atlas-panel p-3`）：

1. **当前 Bucket**：标题 `t('inspector.currentBucket')` + `activeBucket` 名；治理摘要 4 项（Versioning/HTTPS/Lifecycle/公开），数据源 `useProviderFeaturesQuery` 是否含 `versioning`/`lifecycle` 等 + `settings.https`；每项 `CheckCircle2` 图标 + 名 + 状态值。底部"管理"按钮派发 `window.dispatchEvent(new Event('cloud-pika:open-bucket-settings'))`。
2. **传输队列**：读 `useTransferStore`，取 queued+running，每项：类型 + 进度% + key（截断）+ 6px 进度条（`bg-[var(--bg-raised)]` 轨道、`bg-[var(--accent)]` 填充）。无任务显示 `t('inspector.noTransfers')`。
3. **快速动作**：三个 32px 按钮，派发 `cloud-pika:batch-copy-url`/`cloud-pika:batch-refresh-cdn`/`cloud-pika:batch-download`；`selectedKeys.size===0` 时 `disabled`，并显示选中数 `t('inspector.selected', {count})`。

> "管理"按钮事件由 BucketPage 监听打开 `BucketSettingsDrawer`（下step）。CDN 刷新按钮仅在 provider 支持时启用——检查器无法直接拿 featureList，则始终渲染但点击由 BucketPage 内部判断（不支持时 `handleBatchRefreshCDN` 已 try/catch）。

- [x] **Step 2：BucketPage 监听打开治理抽屉事件**

`BucketPage.tsx` 新增 effect 监听 `cloud-pika:open-bucket-settings` → `setSettingsDrawerOpen(true)`（与 Task 12 的事件 effect 合并或并列）。

- [x] **Step 3：AppLayout 挂载真实 Inspector + 移除底部 TransferPanel**

确认 `AppLayout` 已渲染 `<AppInspector />`（阶段 2 占位被本任务替换），且**不**渲染 `TransferPanel`。

- [x] **Step 4：验证构建 + 测试 + 目测**

Run: `cd frontend && npm run build && npm run test:run`
Expected: 成功、PASS。`npm run dev`：检查器显示治理摘要/队列；有传输任务时进度实时；选中对象后快速动作可用并触发批量操作；"管理"打开治理抽屉。

- [ ] **Step 5：阶段提交（先审查）**

```bash
git add frontend/src/stores/useBucketStore.ts \
  frontend/src/stores/__tests__/useBucketStore.test.ts \
  frontend/src/pages/BucketPage.tsx \
  frontend/src/components/layout/AppInspector.tsx \
  frontend/src/components/layout/AppLayout.tsx
# /local-review 通过后提交
git commit -m "feat(inspector): 右侧常驻检查器 接管传输队列/治理摘要/快速动作"
```

---

## 阶段 5：Dialog / Drawer / Form 密度统一

### Task 14：基础组件与对话框密度统一

**Files:** Modify `frontend/src/components/ui/Input.tsx`、`frontend/src/components/ui/Dialog.tsx`、`frontend/src/components/settings/SettingsDrawer.tsx`、`frontend/src/components/bucket/BucketSettingsDrawer.tsx`、`frontend/src/components/account/AccountDialog.tsx`、`frontend/src/components/transfers/TransferPanel.tsx`

当前状态：`Input`、`Dialog`、`SettingsDrawer`、`BucketSettingsDrawer`、`TransferPanel` 与命令面板遮罩已做 Atlas 基础密度兼容；扫描仍有媒体预览和若干旧自定义 Dialog 残留，待后续单独清理。

- [x] **Step 1：基础组件**

- `Input`：高度统一 `h-8`，圆角 `rounded-[8px]`，focus 自定义环 `focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30`，去玻璃底。
- `Dialog`：容器 `rounded-[8px]`（由 `rounded-2xl`）、`bg-[var(--bg-card)]`、阴影 `shadow-[var(--shadow-xl)]`；遮罩保留轻量 `bg-[rgba(13,17,21,0.4)]`，去重 `backdrop-blur` 营销感（可保留极轻 blur）。

- [ ] **Step 2：抽屉/对话框**

`SettingsDrawer`/`BucketSettingsDrawer`/`AccountDialog`：移除 `glass`/`bento`/`gradient`/`shadow-glow` 等 class，面板改 `.atlas-panel`，按钮 32px、圆角 8px，分组用幽灵线/背景层差而非大卡片。

- [x] **Step 3：清理 TransferPanel 残留**

`TransferPanel.tsx` 已不再挂载（阶段 4）。移除其 `glass`/`rounded-2xl` 等失效引用即可（文件保留或删除：本计划保留文件不挂载，避免影响其测试）。其测试 `TransferCard.test.tsx` 针对 `TransferCard`，不受影响。

- [ ] **Step 4：全局玻璃态残留扫描**

Run: `cd frontend && grep -rnE "glass|bento|gradient-primary|backdrop-blur|shadow-glow|rounded-3xl|rounded-2xl" src/ || echo "clean"`
Expected: 输出为空或仅剩有意保留项（逐项确认无营销态残留）。

- [x] **Step 5：验证构建 + 测试**

Run: `cd frontend && npm run build && npm run test:run`
Expected: 成功、PASS。

- [ ] **Step 6：阶段提交（先审查）**

```bash
git add frontend/src/components/ui/Input.tsx frontend/src/components/ui/Dialog.tsx \
  frontend/src/components/settings/SettingsDrawer.tsx \
  frontend/src/components/bucket/BucketSettingsDrawer.tsx \
  frontend/src/components/account/AccountDialog.tsx \
  frontend/src/components/transfers/TransferPanel.tsx
# /local-review 通过后提交
git commit -m "style(ui): 统一对话框/抽屉/输入为 Atlas 密度"
```

---

## 阶段 6：收尾（main.go / i18n / 全局规则 / 验收）

### Task 15：main.go Windows frameless

**Files:** Modify `main.go`

当前状态：已按当前 Wails v3 API 增加顶层 `Frameless: true`；`go build ./...` 通过，只有 macOS 链接器 warning。

- [x] **Step 1：为 Windows 增加 frameless 配置**

在 `WebviewWindowOptions` 增加 Windows 字段（与现有 Mac 字段并列）：

```go
		Windows: application.WindowsWindow{
			Frameless: true,
		},
```

> macOS 字段保持不变。Frameless 后由前端 `AppTitlebar` 的 Windows 分支提供窗口按钮与拖拽区。

- [x] **Step 2：验证 Go 构建**

Run: `cd /Users/goll/work/my/cloud-pika && go build ./...`
Expected: 成功。
> 字段名若与当前 Wails v3 alpha 不符（如 `DisableFramelessWindowDecorations`），按 `go doc github.com/wailsapp/wails/v3/pkg/application.WindowsWindow` 输出取实际字段。

### Task 16：i18n 补齐

**Files:** Modify `frontend/src/i18n/i18n.ts`

当前状态：已补齐本计划要求的 `titlebar`、`metrics`、`inspector`、`status` 与 `bucket.columnStatus` 中英文文案。

- [x] **Step 1：zh-CN 与 en-US 各新增以下分组**

`titlebar`: `commandPlaceholder`（"搜索对象、Bucket、账户或命令" / "Search objects, buckets, accounts or commands"）、`minimize`/`maximize`/`close`。
`metrics`: `objects`/`storage`/`cdn`/`queue` 及对应 hint。
`inspector`: `currentBucket`/`governance`/`transfers`/`noTransfers`/`quickActions`/`manage`/`selected`/`batchCopyUrl`/`batchRefreshCdn`/`batchDownload`。
`status`: `folder`（"文件夹"/"Folder"）、`ready`（"就绪"/"Ready"）。
`bucket.columnStatus`: "状态"/"Status"。

- [x] **Step 2：验证构建 + 中英切换目测**

Run: `cd frontend && npm run build`
Expected: 成功。`npm run dev` 切中/英，标题栏、指标、检查器、状态列文案不溢出。

### Task 17：更新全局 UI 规则

**Files:** Modify `~/.claude/rules/ui-rules.md`

当前状态：已更新 `~/.claude/rules/ui-rules.md` 为 Atlas Ops 规范。该文件位于项目工作区外，不纳入 git。

- [x] **Step 1：改写为 Atlas Ops 规范**

将文件整体改写：定位"Atlas Ops 高密度多云工作台"，要点——语义令牌 + `data-theme` 双主题、8px 圆角、四区布局（标题栏/侧栏/中央/检查器）、1px 幽灵线分隔、禁毛玻璃/大渐变/漂浮大卡片/卡片套卡片、表格密度优先、跨平台标题栏、图标用 lucide-react Light。与 `docs/atlas-ops-ui-design-spec.md` 对齐（可摘其关键章节）。

> 此为用户全局配置文件，不纳入项目 git 提交。

### Task 18：全量验收 + 收尾提交

当前状态：已完成 `npm run build`、`npm run test:run`、`go build ./...`、浏览器 `1280×820` 与 `960×680` 布局检查、`/designs` 可访问检查；尚未做 Windows 实机与 8 组合完整验收，也尚未阶段提交。

- [ ] **Step 1：按规范 §14 验收（8 组合）**

`npm run dev`，依次在 1280×820 与 960×680（用浏览器/窗口缩放或 `DesignShowcasePage` 多尺寸预览）× 浅/深主题 × macOS/Windows 标题栏分支，逐项核对：无页面级横向滚动、标题栏按钮不遮挡命令入口、Windows 窗口按钮区独立、表格主列可读、深色对比度足够、中英不溢出。macOS 本机验证；Windows 分支可临时改 `detectPlatform` 返回值或 mock UA 目测布局，实机效果由用户在 Windows 复核。

- [x] **Step 2：全量构建与测试**

Run: `cd frontend && npm run build && npm run test:run` 且 `cd /Users/goll/work/my/cloud-pika && go build ./...`
Expected: 全部成功、测试 PASS。

- [ ] **Step 3：阶段提交（先审查）**

```bash
git add main.go frontend/src/i18n/i18n.ts
# /local-review 通过后提交
git commit -m "feat: Windows frameless 标题栏 + Atlas i18n 文案"
```

- [ ] **Step 4：完成分支处理**

调用 superpowers:finishing-a-development-branch 决定合并/PR/清理。

---

## 自审清单（写计划后核对）

- **Spec 覆盖**：令牌(§4→T1-2)、四区布局(§5→T6)、标题栏(§6.1→T3-5,T15)、指标(§6.2→T8)、工具栏/面包屑(§6.3→T9)、表格(§6.4→T10)、检查器(§6.5→T13)、状态提升(§6.6→T11-12)、密度(§6.7→T14)、i18n(§7→T16)、main.go(§8→T15)、全局规则(§9→T17)、验收(§11→T18)。✅ 全覆盖。
- **占位符**：无 TBD/TODO；纯函数与 store 给完整代码与测试，样式给精确值与目标 class。
- **类型一致**：`detectPlatform`/`windowControls`/`getObjectStatus`/`deriveMetrics`/`selectedKeys`/`setSelectedKeys`/`clearSelection` 命名跨任务一致；事件名 `cloud-pika:open-command`/`:batch-copy-url`/`:batch-refresh-cdn`/`:batch-download`/`:open-bucket-settings` 派发端(T13)与监听端(T5,T12,T13)一致。
- **风险**：Wails Windows 字段名与 runtime Window API 命名为已知不确定点，已分别隔离到单文件并给回退指引。
