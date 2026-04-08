import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FolderKanban,
  KeyRound,
  Settings2,
  Workflow,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SimpleTooltip } from '@/components/ui/Tooltip';

const navItems = [
  { to: '/login', icon: KeyRound, key: 'nav.accounts' },
  { to: '/bucket', icon: FolderKanban, key: 'nav.explorer' },
  { to: '/transfers', icon: Workflow, key: 'nav.transfer' },
  { to: '/settings', icon: Settings2, key: 'nav.settings' },
];

/** 窄窗口折叠阈值（px） */
const COLLAPSE_WIDTH = 900;

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(
    window.innerWidth < COLLAPSE_WIDTH,
  );

  // 监听窗口尺寸变化，自动折叠/展开
  useEffect(() => {
    const onResize = () => {
      setCollapsed(window.innerWidth < COLLAPSE_WIDTH);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <aside
      className={[
        'shrink-0 bg-[var(--surface-low)] p-3',
        'transition-[width] duration-200',
        collapsed ? 'w-[64px]' : 'w-[248px] p-4',
      ].join(' ')}
    >
      {/* 标题区域：折叠时隐藏 */}
      {!collapsed ? (
        <div className="mb-6 px-2">
          <h1
            className={
              'font-display text-xl font-semibold '
              + 'tracking-tight'
            }
          >
            Cloud Pika
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Digital Obsidian Workspace
          </p>
        </div>
      ) : null}

      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          const label = t(item.key);

          const linkEl = (
            <Link
              key={item.to}
              to={item.to}
              className={[
                'flex items-center gap-3',
                'rounded-[var(--radius)] px-3 py-2.5',
                'text-sm transition-all',
                collapsed ? 'justify-center' : '',
                active
                  ? 'bg-[var(--surface-elevated)] '
                    + 'text-[var(--text)]'
                  : 'text-[var(--text-muted)] '
                    + 'hover:bg-[var(--surface-elevated)]/70 '
                    + 'hover:text-[var(--text)]',
              ].join(' ')}
            >
              <Icon size={16} />
              {!collapsed ? <span>{label}</span> : null}
            </Link>
          );

          // 折叠模式下 hover 显示 Tooltip
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
    </aside>
  );
}
