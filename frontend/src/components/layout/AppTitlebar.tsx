import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import {
  Command,
  Languages,
  Maximize2,
  Minus,
  Moon,
  Search,
  Settings2,
  Sun,
  User,
  X,
} from 'lucide-react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { AccountDialog } from '@/components/account/AccountDialog';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { SimpleTooltip } from '@/components/ui/Tooltip';
import { detectPlatform } from '@/lib/platform';
import { windowControls } from '@/lib/window-controls';
import { useAccountStore } from '@/stores/useAccountStore';
import { useAppStore } from '@/stores/useAppStore';

const pageTitleMap: Record<string, string> = {
  '/bucket': 'nav.explorer',
  '/shared': 'nav.shared',
  '/starred': 'nav.starred',
  '/trash': 'nav.trash',
};

function dispatchCommandPalette() {
  window.dispatchEvent(new Event('cloud-pika:open-command'));
}

export function AppTitlebar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const platform = useMemo(() => detectPlatform(), []);
  const isWindows = platform === 'win';

  const accounts = useAccountStore((s) => s.accounts);
  const accountDialogOpen = useAccountStore((s) => s.accountDialogOpen);
  const setAccountDialogOpen = useAccountStore(
    (s) => s.setAccountDialogOpen,
  );
  const activeAccountId = useAccountStore((s) => s.activeAccountId);

  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  useEffect(() => {
    if (accounts.length === 0) {
      setAccountDialogOpen(true);
    }
  }, [accounts.length, setAccountDialogOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        dispatchCommandPalette();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const title = useMemo(() => {
    const matchedKey = Object.keys(pageTitleMap).find((path) =>
      pathname.startsWith(path),
    );
    return matchedKey ? t(pageTitleMap[matchedKey]) : t('appName');
  }, [pathname, t]);

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleToggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    setSettings({ ...settings, theme: next });
  };

  const handleToggleLanguage = () => {
    const next = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
    setLocale(next);
    setSettings({ ...settings, language: next });
    void i18n.changeLanguage(next);
  };

  return (
    <header
      className="col-span-full flex h-[var(--titlebar-height)] select-none items-center border-b border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
      style={{ '--wails-draggable': 'drag' } as CSSProperties}
    >
      {!isWindows ? (
        <div className="flex w-[84px] items-center gap-2 pl-4">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          <div className="truncate text-[11px] text-[var(--text-secondary)]">
            {activeAccountId
              ? t('titlebar.connected')
              : t('titlebar.noAccount')}
          </div>
        </div>

        <button
          type="button"
          onClick={dispatchCommandPalette}
          style={{ '--wails-draggable': 'no-drag' } as CSSProperties}
          className="ml-auto hidden h-8 min-w-[240px] items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--bg-raised)] px-3 text-left text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/30 hover:text-[var(--text)] md:flex"
        >
          <Search size={14} />
          <span className="flex-1 truncate">
            {t('titlebar.commandPlaceholder')}
          </span>
          <span className="rounded bg-[var(--bg-card)] px-1.5 py-0.5 text-[10px]">
            {isWindows ? 'Ctrl K' : '⌘K'}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <SimpleTooltip content={t('titlebar.commandPlaceholder')}>
            <button
              type="button"
              onClick={dispatchCommandPalette}
              style={{ '--wails-draggable': 'no-drag' } as CSSProperties}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)] md:hidden"
            >
              <Command size={15} />
            </button>
          </SimpleTooltip>

          <SimpleTooltip content={t('header.toggleTheme')}>
            <button
              type="button"
              onClick={handleToggleTheme}
              style={{ '--wails-draggable': 'no-drag' } as CSSProperties}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)]"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </SimpleTooltip>

          <SimpleTooltip content={t('header.toggleLanguage')}>
            <button
              type="button"
              onClick={handleToggleLanguage}
              style={{ '--wails-draggable': 'no-drag' } as CSSProperties}
              className="flex h-8 items-center gap-1 rounded-[8px] px-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)]"
            >
              <Languages size={13} />
              <span>{locale === 'zh-CN' ? '中文' : 'EN'}</span>
            </button>
          </SimpleTooltip>

          <SimpleTooltip content={t('nav.settings')}>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              style={{ '--wails-draggable': 'no-drag' } as CSSProperties}
              className={[
                'flex h-8 w-8 items-center justify-center rounded-[8px]',
                settingsOpen
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)]',
              ].join(' ')}
            >
              <Settings2 size={15} />
            </button>
          </SimpleTooltip>

          <SimpleTooltip content={t('header.manageAccounts')}>
            <button
              type="button"
              onClick={() => setAccountDialogOpen(true)}
              style={{ '--wails-draggable': 'no-drag' } as CSSProperties}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)]"
            >
              <User size={14} />
            </button>
          </SimpleTooltip>
        </div>
      </div>

      {isWindows ? (
        <div className="flex h-full">
          <button
            type="button"
            onClick={windowControls.minimise}
            style={{ '--wails-draggable': 'no-drag' } as CSSProperties}
            className="flex h-full w-11 items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)]"
            aria-label={t('titlebar.minimize')}
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            onClick={windowControls.toggleMaximise}
            style={{ '--wails-draggable': 'no-drag' } as CSSProperties}
            className="flex h-full w-11 items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)]"
            aria-label={t('titlebar.maximize')}
          >
            <Maximize2 size={14} />
          </button>
          <button
            type="button"
            onClick={windowControls.close}
            style={{ '--wails-draggable': 'no-drag' } as CSSProperties}
            className="flex h-full w-11 items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--danger)] hover:text-white"
            aria-label={t('titlebar.close')}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <AccountDialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
      />
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}
