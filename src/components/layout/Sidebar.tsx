import { Link, useLocation } from 'react-router-dom';
import { FolderKanban, KeyRound, Settings2, Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const navItems = [
  { to: '/login', icon: KeyRound, key: 'nav.accounts' },
  { to: '/bucket', icon: FolderKanban, key: 'nav.explorer' },
  { to: '/transfers', icon: Workflow, key: 'nav.transfer' },
  { to: '/settings', icon: Settings2, key: 'nav.settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <aside className="w-[78px] shrink-0 bg-[var(--surface-low)] p-3 sm:w-[248px] sm:p-4">
      <div className="mb-6 hidden px-2 sm:block">
        <h1 className="font-display text-xl font-semibold tracking-tight">Cloud Pika</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{t('sidebar.subtitle')}</p>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                'flex items-center justify-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm transition-all sm:justify-start',
                active
                  ? 'bg-[var(--surface-elevated)] text-[var(--text)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]/70 hover:text-[var(--text)]',
              ].join(' ')}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
