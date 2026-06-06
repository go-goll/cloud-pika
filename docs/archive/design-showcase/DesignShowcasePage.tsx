import { type CSSProperties, useState } from 'react';
import {
  AppWindow,
  Archive,
  Bell,
  Braces,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Copy,
  Database,
  Download,
  File,
  FileImage,
  Folder,
  HardDrive,
  LayoutList,
  Link2,
  Maximize2,
  MoreHorizontal,
  Palette,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';
import './DesignShowcasePage.css';

type PlatformId = 'macos' | 'windows';
type WindowSizeId = 'best' | 'minimum';
type ThemeId = 'light' | 'dark';
type FileIconKind = 'folder' | 'image' | 'code' | 'archive' | 'file';

interface FileMock {
  name: string;
  meta: string;
  size: string;
  updated: string;
  status: string;
  icon: FileIconKind;
}

const platforms: Array<{
  id: PlatformId;
  label: string;
  shortcut: string;
  titlebarNote: string;
}> = [
  {
    id: 'macos',
    label: 'macOS',
    shortcut: '⌘K',
    titlebarNote: '左侧交通灯，标题栏保留拖拽区。',
  },
  {
    id: 'windows',
    label: 'Windows',
    shortcut: 'Ctrl K',
    titlebarNote: '右侧窗口按钮，命令入口避开系统控件。',
  },
];

const windowSizes: Array<{
  id: WindowSizeId;
  label: string;
  width: number;
  height: number;
  description: string;
}> = [
  {
    id: 'best',
    label: '最佳尺寸',
    width: 1280,
    height: 820,
    description: '默认窗口，信息密度、预览与队列状态最均衡。',
  },
  {
    id: 'minimum',
    label: '最小尺寸',
    width: 960,
    height: 680,
    description: '可用下限，必须无横向溢出、无控件遮挡。',
  },
];

const themes: Array<{
  id: ThemeId;
  label: string;
  detail: string;
}> = [
  { id: 'light', label: '浅色', detail: 'Day' },
  { id: 'dark', label: '深色', detail: 'Night' },
];

const files: FileMock[] = [
  {
    name: 'campaign/hero-2026.png',
    meta: 'PNG image · public-read · CDN',
    size: '4.8 MB',
    updated: '3 分钟前',
    status: 'Ready',
    icon: 'image',
  },
  {
    name: 'backups/weekly/',
    meta: 'Folder · lifecycle 30d',
    size: '12.4 GB',
    updated: '今天 09:12',
    status: 'Private',
    icon: 'folder',
  },
  {
    name: 'web/app.bundle.js',
    meta: 'JavaScript · gzip · versioned',
    size: '832 KB',
    updated: '昨天 22:41',
    status: 'CDN stale',
    icon: 'code',
  },
  {
    name: 'exports/orders-0605.zip',
    meta: 'Archive · encrypted',
    size: '318 MB',
    updated: '周三',
    status: 'Signed URL',
    icon: 'archive',
  },
  {
    name: 'docs/root-program-notes.md',
    meta: 'Markdown · private',
    size: '42 KB',
    updated: '5 天前',
    status: 'Latest',
    icon: 'file',
  },
  {
    name: 'avatars/team/alex.webp',
    meta: 'WebP image · cache 7d',
    size: '128 KB',
    updated: '6 天前',
    status: 'Ready',
    icon: 'image',
  },
];

const buckets = [
  ['prod-assets', '18.4K 对象'],
  ['analytics-archive', '2.1M 对象'],
  ['static-site', '942 对象'],
  ['private-backups', '88 对象'],
];

const jobs = [
  ['videos/launch.mov', '上传', 72],
  ['logs/2026-06-05.tar', '下载', 38],
  ['remote/import.csv', '抓取', 91],
] as const;

function FileGlyph({ type }: { type: FileIconKind }) {
  const className = 'atlas-file-glyph';
  if (type === 'folder') return <Folder size={18} className={className} />;
  if (type === 'image') return <FileImage size={18} className={className} />;
  if (type === 'code') return <Braces size={18} className={className} />;
  if (type === 'archive') return <Archive size={18} className={className} />;
  return <File size={18} className={className} />;
}

function SegmentedControl<T extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: T;
  items: Array<{ id: T; label: string; detail?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="atlas-segment" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={value === item.id ? 'is-active' : ''}
          onClick={() => onChange(item.id)}
        >
          <span>{item.label}</span>
          {item.detail ? <small>{item.detail}</small> : null}
        </button>
      ))}
    </div>
  );
}

function AtlasTitlebar({ platform }: { platform: PlatformId }) {
  const platformMeta =
    platforms.find((item) => item.id === platform) ?? platforms[0];

  return (
    <div className={`atlas-titlebar atlas-titlebar--${platform}`}>
      {platform === 'macos' ? (
        <div className="atlas-window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <div className="atlas-app-id">
          <img src="/images/logo.svg" alt="" />
          <span>Cloud Pika</span>
        </div>
      )}

      <button className="atlas-command" type="button">
        <Search size={14} />
        <span>搜索对象、Bucket、账户或命令</span>
        <kbd>{platformMeta.shortcut}</kbd>
      </button>

      <div className="atlas-title-actions">
        <button type="button" aria-label="theme">
          <Palette size={15} />
        </button>
        <button type="button" aria-label="notifications">
          <Bell size={15} />
        </button>
        <button type="button" aria-label="settings">
          <Settings2 size={15} />
        </button>
      </div>

      {platform === 'windows' ? (
        <div className="atlas-window-actions" aria-hidden="true">
          <button type="button">
            <span />
          </button>
          <button type="button">
            <Maximize2 size={12} />
          </button>
          <button className="is-close" type="button">
            <X size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AtlasSidebar() {
  return (
    <aside className="atlas-sidebar">
      <div className="atlas-brand">
        <img src="/images/logo.svg" alt="Cloud Pika" />
        <div>
          <strong>Cloud Pika</strong>
          <span>Atlas Ops Workspace</span>
        </div>
      </div>

      <nav className="atlas-nav">
        <button className="is-active" type="button">
          <Database size={16} />
          <span>对象浏览</span>
        </button>
        <button type="button">
          <Zap size={16} />
          <span>传输任务</span>
        </button>
        <button type="button">
          <ShieldCheck size={16} />
          <span>治理策略</span>
        </button>
        <button type="button">
          <HardDrive size={16} />
          <span>存储概览</span>
        </button>
      </nav>

      <div className="atlas-buckets">
        <div className="atlas-section-title">
          <span>Bucket</span>
          <ChevronDown size={14} />
        </div>
        {buckets.map(([name, count], index) => (
          <button
            key={name}
            className={index === 0 ? 'is-active' : ''}
            type="button"
          >
            <Database size={14} />
            <span>
              <strong>{name}</strong>
              <small>{count}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="atlas-account">
        <span className="atlas-status-dot" />
        <div>
          <strong>prod-qiniu</strong>
          <small>Qiniu · 华东 · 在线</small>
        </div>
      </div>
    </aside>
  );
}

function AtlasMetrics() {
  const metrics = [
    ['对象', '18,420', '+212 今日'],
    ['存储', '1.42 TB', '72% 已用'],
    ['CDN', 'Healthy', '刷新余量 482'],
    ['队列', '3', '2 上传 / 1 下载'],
  ];

  return (
    <section className="atlas-metrics">
      {metrics.map(([label, value, hint]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{hint}</small>
        </div>
      ))}
    </section>
  );
}

function AtlasToolbar() {
  return (
    <div className="atlas-toolbar">
      <div className="atlas-breadcrumb">
        <Cloud size={16} />
        <span>prod-assets</span>
        <span>/</span>
        <strong>campaign</strong>
      </div>
      <div className="atlas-toolbar-actions">
        <button type="button">
          <LayoutList size={15} />
        </button>
        <button type="button">
          <SlidersHorizontal size={15} />
          <span>按更新时间</span>
        </button>
        <button type="button">
          <RefreshCcw size={15} />
        </button>
        <button className="atlas-primary" type="button">
          <UploadCloud size={15} />
          <span>上传</span>
        </button>
      </div>
    </div>
  );
}

function AtlasObjectTable() {
  return (
    <div className="atlas-table">
      <div className="atlas-table-head">
        <span>名称</span>
        <span>大小</span>
        <span>更新时间</span>
        <span>状态</span>
        <span />
      </div>
      {files.map((file) => (
        <div className="atlas-row" key={file.name}>
          <span className="atlas-row-name">
            <FileGlyph type={file.icon} />
            <span>
              <strong>{file.name}</strong>
              <small>{file.meta}</small>
            </span>
          </span>
          <span>{file.size}</span>
          <span>{file.updated}</span>
          <span
            className={
              file.status === 'CDN stale'
                ? 'atlas-status is-warning'
                : 'atlas-status'
            }
          >
            {file.status}
          </span>
          <button type="button">
            <MoreHorizontal size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

function AtlasInspector() {
  return (
    <aside className="atlas-inspector">
      <section>
        <span className="atlas-panel-label">当前 Bucket</span>
        <h3>prod-assets</h3>
        <p>默认域名已绑定，版本控制开启，上传后自动刷新 CDN。</p>
        <div className="atlas-policy-grid">
          <div>
            <CheckCircle2 size={15} />
            <span>Versioning</span>
            <strong>On</strong>
          </div>
          <div>
            <CheckCircle2 size={15} />
            <span>HTTPS</span>
            <strong>Default</strong>
          </div>
          <div>
            <CheckCircle2 size={15} />
            <span>Lifecycle</span>
            <strong>30d</strong>
          </div>
        </div>
      </section>

      <section>
        <span className="atlas-panel-label">传输队列</span>
        <div className="atlas-jobs">
          {jobs.map(([name, type, progress]) => (
            <div key={name}>
              <div>
                <span>{type}</span>
                <strong>{progress}%</strong>
              </div>
              <p>{name}</p>
              <div className="atlas-progress">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <span className="atlas-panel-label">快速动作</span>
        <div className="atlas-quick-actions">
          <button type="button">
            <Copy size={15} />
            批量复制 URL
          </button>
          <button type="button">
            <Link2 size={15} />
            CDN 刷新
          </button>
          <button type="button">
            <Download size={15} />
            下载选中
          </button>
        </div>
      </section>
    </aside>
  );
}

function AtlasMain() {
  return (
    <main className="atlas-main">
      <header className="atlas-main-header">
        <div>
          <span>Atlas Ops</span>
          <h2>面向开发者和运维的高密度多云工作台</h2>
        </div>
        <button type="button">
          <ShieldCheck size={15} />
          治理健康
        </button>
      </header>

      <AtlasMetrics />
      <AtlasToolbar />
      <div className="atlas-workarea">
        <AtlasObjectTable />
        <AtlasInspector />
      </div>
    </main>
  );
}

export function DesignShowcasePage() {
  const [platform, setPlatform] = useState<PlatformId>('macos');
  const [windowSize, setWindowSize] =
    useState<WindowSizeId>('best');
  const [theme, setTheme] = useState<ThemeId>('light');
  const activeWindowSize =
    windowSizes.find((size) => size.id === windowSize) ?? windowSizes[0];
  const activePlatform =
    platforms.find((item) => item.id === platform) ?? platforms[0];
  const activeTheme =
    themes.find((item) => item.id === theme) ?? themes[0];
  const frameStyle = {
    '--frame-width': `${activeWindowSize.width}px`,
    '--frame-width-ratio': activeWindowSize.width,
    '--frame-height-ratio': activeWindowSize.height,
  } as CSSProperties;

  return (
    <div className="atlas-lab">
      <header className="atlas-lab-header">
        <div>
          <span>Cloud Pika UI Redesign</span>
          <h1>Atlas Ops 跨平台桌面界面方案</h1>
        </div>
        <div className="atlas-controls">
          <SegmentedControl
            label="Platform preview"
            value={platform}
            items={platforms}
            onChange={setPlatform}
          />
          <SegmentedControl
            label="Window size preview"
            value={windowSize}
            items={windowSizes.map((size) => ({
              id: size.id,
              label: size.label,
              detail: `${size.width}×${size.height}`,
            }))}
            onChange={setWindowSize}
          />
          <SegmentedControl
            label="Theme preview"
            value={theme}
            items={themes}
            onChange={setTheme}
          />
        </div>
      </header>

      <section className="atlas-canvas-meta">
        <span>画布规格</span>
        <strong>
          {activeWindowSize.label}: {activeWindowSize.width}×{activeWindowSize.height}
        </strong>
        <small>{activeWindowSize.description}</small>
        <small>{activePlatform.titlebarNote}</small>
        <small>主题: {activeTheme.label}模式</small>
      </section>

      <div className="atlas-frame-shell">
        <section
          className={`atlas-frame atlas-platform--${platform} atlas-theme--${theme}`}
          style={frameStyle}
        >
          <AtlasTitlebar platform={platform} />
          <div className="atlas-shell">
            <AtlasSidebar />
            <AtlasMain />
          </div>
        </section>
      </div>

      <section className="atlas-notes">
        <div>
          <span>尺寸原则</span>
          <p>所有核心工作流按 1280×820 展开，960×680 下保留侧栏、表格、批量动作和队列状态。</p>
        </div>
        <div>
          <span>跨平台原则</span>
          <p>macOS 与 Windows 使用同一信息架构，但标题栏控件、快捷键和可拖拽区域按平台分开处理。</p>
        </div>
        <div>
          <span>下一步落地</span>
          <p>将 Atlas 的密度、状态栏、右侧检查器迁移到真实 BucketPage，并补齐深浅主题变量。</p>
        </div>
      </section>
    </div>
  );
}
