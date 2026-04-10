import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Database,
  FolderOpen,
  HelpCircle,
  Share2,
  Star,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SimpleTooltip } from '@/components/ui/Tooltip';
import { useBucketStore } from '@/stores/useBucketStore';

/** 导航菜单项配置 */
const navItems = [
  { to: '/bucket', icon: FolderOpen, key: 'nav.explorer' },
  { to: '/shared', icon: Share2, key: 'nav.shared' },
  { to: '/starred', icon: Star, key: 'nav.starred' },
  { to: '/trash', icon: Trash2, key: 'nav.trash' },
];

/** 窄窗口折叠阈值（px） */
const COLLAPSE_WIDTH = 900;

/** 侧边栏展开宽度 */
export const SIDEBAR_WIDTH = 220;

/** 侧边栏折叠宽度 */
export const SIDEBAR_COLLAPSED_WIDTH = 64;

/** 侧边栏组件，支持自动折叠/展开 */
export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(
    window.innerWidth < COLLAPSE_WIDTH,
  );
  const buckets = useBucketStore((s) => s.buckets);
  const activeBucket = useBucketStore((s) => s.activeBucket);
  const setActiveBucket = useBucketStore((s) => s.setActiveBucket);

  useEffect(() => {
    const onResize = () => {
      setCollapsed(window.innerWidth < COLLAPSE_WIDTH);
    };
    window.addEventListener('resize', onResize);
    return () =>
      window.removeEventListener('resize', onResize);
  }, []);

  const sidebarWidth = collapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_WIDTH;

  return (
    <aside
      className="glass fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border)]/30 transition-[width] duration-200"
      style={{ width: sidebarWidth }}
    >
      {/* 品牌区域 */}
      <div className={[
        'flex items-center px-5 py-5',
        collapsed ? 'justify-center' : 'gap-3',
      ].join(' ')}>
        <img
          src="/images/logo.svg"
          alt="Cloud Pika"
          className={collapsed ? 'h-8 w-8 shrink-0' : 'h-10 w-10 shrink-0'}
        />
        {!collapsed && (
          <div className="min-w-0">
            <span className="font-display text-base font-bold tracking-tight">
              Cloud Pika
            </span>
            <p className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              {t('sidebar.atmosphericStorage')}
            </p>
          </div>
        )}
      </div>

      {/* 上传按钮 */}
      <div className="mx-4 mt-2">
        {collapsed ? (
          <SimpleTooltip content={t('nav.upload')} side="right">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('cloud-pika:upload-active'))}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-text)] transition-colors hover:opacity-90"
            >
              <Upload size={18} />
            </button>
          </SimpleTooltip>
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('cloud-pika:upload-active'))}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-medium text-[var(--accent-text)] transition-colors hover:opacity-90"
          >
            <Upload size={16} />
            <span>{t('nav.upload')}</span>
          </button>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="mt-6 space-y-1 px-3">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          const label = t(item.key);

          const linkEl = (
            <Link
              key={item.to}
              to={item.to}
              className={[
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                collapsed ? 'justify-center' : '',
                active
                  ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[rgba(234,239,242,0.4)] dark:hover:bg-[rgba(255,255,255,0.06)]',
              ].join(' ')}
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <SimpleTooltip
                key={item.to}
                content={label}
                side="right"
              >
                {linkEl}
              </SimpleTooltip>
            );
          }

          return linkEl;
        })}
      </nav>

      {/* Bucket 子列表（展开状态 + 资源浏览器路由） */}
      {!collapsed
        && location.pathname.startsWith('/bucket')
        && buckets.length > 0 && (
        <div className="mt-1 max-h-[240px] space-y-0.5 overflow-y-auto px-3">
          {buckets.map((bucket) => {
            const isActive = activeBucket === bucket.name;
            return (
              <button
                key={bucket.name}
                type="button"
                onClick={() => setActiveBucket(bucket.name)}
                className={[
                  'flex w-full items-center gap-2 rounded-lg pl-10 py-2 text-sm transition-all',
                  isActive
                    ? 'text-[var(--accent)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[rgba(234,239,242,0.4)] dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text)]',
                ].join(' ')}
              >
                <Database
                  size={14}
                  className={
                    isActive
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-secondary)]'
                  }
                />
                <span className="truncate">{bucket.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 底部区域 */}
      <div className="mt-auto px-4 pb-4">
        {/* 存储状态 */}
        {!collapsed && (
          <div className="mb-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              {t('sidebar.storageStatus')}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-raised)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: '35%' }}
              />
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              {t('sidebar.storageUsed', { percent: 35 })}
            </p>
            <button
              type="button"
              className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)]"
            >
              {t('sidebar.upgradeStorage')}
            </button>
          </div>
        )}

        {/* 分隔线 */}
        <div className="mb-2 border-t border-[var(--border)]/30" />

        {/* Support */}
        {(() => {
          const content = (
            <button
              type="button"
              className={[
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all',
                'text-[var(--text-secondary)] hover:bg-[rgba(234,239,242,0.4)] dark:hover:bg-[rgba(255,255,255,0.06)]',
                collapsed ? 'justify-center' : '',
              ].join(' ')}
            >
              <HelpCircle size={16} />
              {!collapsed && <span>{t('nav.support')}</span>}
            </button>
          );
          return collapsed ? (
            <SimpleTooltip content={t('nav.support')} side="right">
              {content}
            </SimpleTooltip>
          ) : content;
        })()}

        {/* 折叠切换按钮 */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="mt-2 flex w-full items-center justify-center rounded-xl py-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)]"
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>
    </aside>
  );
}
