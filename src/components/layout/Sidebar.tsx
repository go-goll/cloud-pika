import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  FolderKanban,
  KeyRound,
  Settings2,
  Workflow,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@/stores/useAccountStore';
import { providerOptions } from '@/lib/provider';

/** localStorage 持久化键名 */
const COLLAPSED_KEY = 'cloud-pika-sidebar-collapsed';

/** 导航菜单项配置 */
const navItems = [
  { to: '/login', icon: KeyRound, key: 'nav.accounts' },
  {
    to: '/bucket',
    icon: FolderKanban,
    key: 'nav.explorer',
  },
  {
    to: '/transfers',
    icon: Workflow,
    key: 'nav.transfer',
  },
  { to: '/settings', icon: Settings2, key: 'nav.settings' },
];

/** 获取云厂商显示名 */
function getProviderLabel(provider: string): string {
  const option = providerOptions.find(
    (p) => p.value === provider,
  );
  return option?.label ?? provider;
}

/** 侧边栏组件，支持折叠/展开 */
export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  /* 折叠状态 */
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  });

  /* 账户切换菜单 */
  const [showAccountMenu, setShowAccountMenu] =
    useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const accounts = useAccountStore((s) => s.accounts);
  const activeAccountId = useAccountStore(
    (s) => s.activeAccountId,
  );
  const setActiveAccountId = useAccountStore(
    (s) => s.setActiveAccountId,
  );

  const activeAccount = accounts.find(
    (a) => a.id === activeAccountId,
  );

  /** 切换折叠状态 */
  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  /** 切换账户 */
  const handleSwitchAccount = useCallback(
    (id: string) => {
      setActiveAccountId(id);
      setShowAccountMenu(false);
    },
    [setActiveAccountId],
  );

  /* 点击外部关闭菜单 */
  useEffect(() => {
    if (!showAccountMenu) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () =>
      document.removeEventListener('mousedown', handler);
  }, [showAccountMenu]);

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';

  return (
    <aside
      className={[
        sidebarWidth,
        'relative flex h-screen shrink-0 flex-col',
        'glass-panel ghost-border',
        'border-l-0 border-t-0 border-b-0',
        'transition-all duration-200',
      ].join(' ')}
    >
      {/* 顶部品牌区域 */}
      <div className="p-4">
        {!collapsed ? (
          <div
            className="mb-8 flex items-center gap-3 px-2"
          >
            {/* 品牌渐变图标 */}
            <div
              className={[
                'flex h-10 w-10 shrink-0',
                'items-center justify-center',
                'rounded-lg signature-gradient',
                'text-white shadow-sm',
              ].join(' ')}
            >
              <Cloud size={22} fill="currentColor" />
            </div>
            <div>
              <h2
                className={[
                  'font-display text-lg font-bold',
                  'leading-none tracking-tight',
                  'text-[var(--color-on-surface)]',
                ].join(' ')}
              >
                Cloud Pika
              </h2>
              <p
                className={[
                  'mt-0.5 text-[10px] font-semibold',
                  'uppercase tracking-wider',
                  'text-[var(--color-primary)]',
                ].join(' ')}
              >
                Offline Manager
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex justify-center">
            <div
              className={[
                'flex h-10 w-10 items-center',
                'justify-center rounded-lg',
                'signature-gradient',
                'text-white shadow-sm',
              ].join(' ')}
            >
              <Cloud size={20} fill="currentColor" />
            </div>
          </div>
        )}

        {/* 导航列表 */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(
              item.to,
            );
            const Icon = item.icon;

            const linkEl = (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  'group relative flex items-center',
                  'gap-3 rounded-lg py-2.5 text-sm',
                  'font-medium transition-all duration-200',
                  collapsed
                    ? 'justify-center px-2'
                    : 'px-3',
                  active
                    ? [
                        'bg-[var(--color-primary)]/8',
                        'text-[var(--color-primary)]',
                      ].join(' ')
                    : [
                        'text-[var(--color-on-surface-variant)]',
                        'hover:bg-[var(--color-surface-container-low)]',
                        'hover:text-[var(--color-on-surface)]',
                      ].join(' '),
                ].join(' ')}
              >
                {/* 左侧激活指示器 */}
                <span
                  className={[
                    'absolute left-0 top-1/2',
                    'h-5 w-[3px] -translate-y-1/2',
                    'rounded-r-full',
                    'bg-[var(--color-primary)]',
                    'transition-all duration-200',
                    active
                      ? 'opacity-100'
                      : 'opacity-0',
                  ].join(' ')}
                />
                <Icon
                  size={18}
                  className={[
                    'transition-transform',
                    'group-hover:translate-x-0.5',
                  ].join(' ')}
                />
                {!collapsed && (
                  <span>{t(item.key)}</span>
                )}
              </Link>
            );

            /* 折叠时显示 Tooltip */
            if (collapsed) {
              return (
                <TooltipWrap
                  key={item.to}
                  label={t(item.key)}
                >
                  {linkEl}
                </TooltipWrap>
              );
            }

            return linkEl;
          })}
        </nav>
      </div>

      {/* 弹性空间 */}
      <div className="flex-1" />

      {/* 底部账户区域 */}
      {accounts.length > 0 && (
        <div className="relative p-3" ref={menuRef}>
          {/* 账户切换弹出菜单 */}
          {showAccountMenu && (
            <div
              className={[
                'absolute bottom-full',
                'left-2 right-2 mb-1',
                'rounded-lg ghost-border',
                'bg-[var(--color-surface-container-lowest)]',
                'py-1 shadow-lg',
              ].join(' ')}
            >
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() =>
                    handleSwitchAccount(acc.id)
                  }
                  className={[
                    'flex w-full items-center gap-2',
                    'px-3 py-2 text-left text-sm',
                    'transition-colors',
                    'hover:bg-[var(--color-surface-container-low)]',
                    acc.id === activeAccountId
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-on-surface)]',
                  ].join(' ')}
                >
                  <span className="text-xs text-[var(--color-on-surface-variant)]">
                    {getProviderLabel(acc.provider)}
                  </span>
                  <span className="truncate">
                    {acc.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 当前账户按钮 */}
          <button
            type="button"
            onClick={() =>
              setShowAccountMenu((p) => !p)
            }
            className={[
              'flex w-full items-center gap-2',
              'rounded-lg px-2 py-2 text-left',
              'transition-colors',
              'hover:bg-[var(--color-surface-container-low)]',
              collapsed ? 'justify-center' : '',
            ].join(' ')}
            title={
              collapsed
                ? `${activeAccount?.name ?? ''} - ${t('sidebar.switchAccount')}`
                : undefined
            }
          >
            {/* 厂商首字母图标 */}
            <span
              className={[
                'flex h-7 w-7 shrink-0 items-center',
                'justify-center rounded-full',
                'signature-gradient',
                'text-xs font-medium text-white',
              ].join(' ')}
            >
              {(activeAccount?.provider ?? '?')[0]
                .toUpperCase()}
            </span>
            {!collapsed && activeAccount && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-on-surface)]">
                  {activeAccount.name}
                </p>
                <p className="truncate text-xs text-[var(--color-on-surface-variant)]">
                  {getProviderLabel(
                    activeAccount.provider,
                  )}
                </p>
              </div>
            )}
          </button>
        </div>
      )}

      {/* 折叠/展开按钮 */}
      <div className="border-t border-[var(--color-outline-variant)] p-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={[
            'flex w-full items-center',
            'justify-center gap-2',
            'rounded-lg py-2 text-sm',
            'text-[var(--color-on-surface-variant)]',
            'transition-colors',
            'hover:bg-[var(--color-surface-container-low)]',
            'hover:text-[var(--color-on-surface)]',
          ].join(' ')}
          title={
            collapsed
              ? t('sidebar.expand')
              : t('sidebar.collapse')
          }
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>{t('sidebar.collapse')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/** 简易 Tooltip 包装器（折叠态用） */
function TooltipWrap({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      {children}
      <div
        className={[
          'pointer-events-none absolute left-full',
          'top-1/2 z-50 ml-2 -translate-y-1/2',
          'whitespace-nowrap rounded-lg',
          'bg-[var(--color-surface-container-lowest)]',
          'px-2 py-1 text-xs shadow-lg ghost-border',
          'text-[var(--color-on-surface)]',
          'opacity-0 transition-opacity',
          'group-hover:opacity-100',
        ].join(' ')}
      >
        {label}
      </div>
    </div>
  );
}
