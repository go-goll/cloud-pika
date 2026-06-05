import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FolderOpen,
  Upload,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SimpleTooltip } from '@/components/ui/Tooltip';
import { useAccountStore } from '@/stores/useAccountStore';
import { useBucketStore } from '@/stores/useBucketStore';

/** 导航菜单项配置（仅保留已实现的路由） */
const navItems = [
  { to: '/bucket', icon: FolderOpen, key: 'nav.explorer' },
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
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(
    window.innerWidth < COLLAPSE_WIDTH,
  );
  const buckets = useBucketStore((s) => s.buckets);
  const activeBucket = useBucketStore((s) => s.activeBucket);
  const setActiveBucket = useBucketStore((s) => s.setActiveBucket);

  const accounts = useAccountStore((s) => s.accounts);
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId),
    [accounts, activeAccountId],
  );

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

      {/* 底部：账户信息 + 折叠切换 */}
      <div className="mt-auto px-3 pb-3 space-y-2">
        {/* 当前账户 */}
        {activeAccount ? (
          collapsed ? (
            <SimpleTooltip
              content={`${activeAccount.name} (${activeAccount.provider})`}
              side="right"
            >
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex w-full items-center justify-center rounded-xl py-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)]"
              >
                <User size={16} />
              </button>
            </SimpleTooltip>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/')}
              className={[
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5',
                'text-left transition-colors',
                'hover:bg-[var(--bg-raised)]',
              ].join(' ')}
              title={t('sidebar.switchAccount')}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <User size={14} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[var(--text)]">
                  {activeAccount.name}
                </p>
                <p className="truncate text-[10px] text-[var(--text-secondary)]">
                  {activeAccount.provider}
                </p>
              </div>
            </button>
          )
        ) : null}

        {/* 折叠切换 */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex w-full items-center justify-center rounded-xl py-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)]"
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
