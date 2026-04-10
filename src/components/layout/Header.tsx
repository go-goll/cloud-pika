import { useEffect, useState } from 'react';
import {
  FolderKanban,
  KeyRound,
  Languages,
  Moon,
  Settings2,
  Sun,
} from 'lucide-react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Select } from '@/components/ui/Select';
import { SimpleTooltip } from '@/components/ui/Tooltip';
import { AccountDialog } from '@/components/account/AccountDialog';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { useAppStore } from '@/stores/useAppStore';
import { useAccountStore } from '@/stores/useAccountStore';

/** 导航图标按钮基础样式 */
const navBtnBase = [
  'relative flex h-9 w-9 items-center justify-center',
  'rounded-lg transition-all duration-200',
].join(' ');

/** 导航菜单项 */
const navItems = [
  { to: '/bucket', icon: FolderKanban, key: 'nav.explorer' },
];

/** 顶部导航栏：品牌 + 导航 + 全局操作 */
export function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const accounts = useAccountStore((s) => s.accounts);
  const accountDialogOpen = useAccountStore(
    (s) => s.accountDialogOpen,
  );
  const setAccountDialogOpen = useAccountStore(
    (s) => s.setAccountDialogOpen,
  );

  // 没有账户时自动打开账户管理对话框
  useEffect(() => {
    if (accounts.length === 0) {
      setAccountDialogOpen(true);
    }
  }, [accounts.length, setAccountDialogOpen]);

  const activeAccountId = useAccountStore(
    (s) => s.activeAccountId,
  );
  const setActiveAccountId = useAccountStore(
    (s) => s.setActiveAccountId,
  );
  const selectedAccountId =
    activeAccountId || accounts[0]?.id || '';

  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  const handleToggleTheme = () => {
    const next =
      themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    setSettings({ ...settings, theme: next });
  };

  const handleToggleLanguage = () => {
    const next =
      locale === 'zh-CN' ? 'en-US' : 'zh-CN';
    setLocale(next);
    setSettings({ ...settings, language: next });
    void i18n.changeLanguage(next);
  };

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches);

  return (
    <header
      className={[
        'glass sticky top-0 z-30',
        'flex h-14 items-center justify-between',
        'border-b border-[var(--border)]/50 px-4',
      ].join(' ')}
    >
      {/* 左侧：品牌 + 导航 */}
      <div className="flex items-center gap-1">
        {/* 品牌 Logo + 名称 */}
        <div className="flex items-center gap-2.5 mr-5">
          <img
            src="/images/logo.png"
            alt="Cloud Pika"
            className="h-7 w-7 rounded-md"
          />
          <span
            className={[
              'font-display text-sm font-semibold',
              'tracking-tight hidden sm:inline',
            ].join(' ')}
          >
            Cloud Pika
          </span>
        </div>

        {/* 导航按钮组 */}
        <nav className="flex items-center gap-0.5">
          {/* 账户管理按钮 */}
          <SimpleTooltip content={t('header.manageAccounts')}>
            <button
              type="button"
              onClick={() => setAccountDialogOpen(true)}
              className={[
                navBtnBase,
                accountDialogOpen
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : [
                      'text-[var(--text-secondary)]',
                      'hover:bg-[var(--bg-raised)]',
                      'hover:text-[var(--text)]',
                    ].join(' '),
              ].join(' ')}
            >
              <KeyRound size={16} />
              {accountDialogOpen && (
                <span
                  className={[
                    'absolute bottom-0.5 left-1/2',
                    '-translate-x-1/2',
                    'h-0.5 w-4 rounded-full',
                    'bg-[var(--accent)]',
                  ].join(' ')}
                />
              )}
            </button>
          </SimpleTooltip>

          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <SimpleTooltip
                key={item.to}
                content={t(item.key)}
              >
                <Link
                  to={item.to}
                  className={[
                    navBtnBase,
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : [
                          'text-[var(--text-secondary)]',
                          'hover:bg-[var(--bg-raised)]',
                          'hover:text-[var(--text)]',
                        ].join(' '),
                  ].join(' ')}
                >
                  <Icon size={16} />
                  {/* 底部激活指示条 */}
                  {active && (
                    <span
                      className={[
                        'absolute bottom-0.5 left-1/2',
                        '-translate-x-1/2',
                        'h-0.5 w-4 rounded-full',
                        'bg-[var(--accent)]',
                        'animate-fade-in',
                      ].join(' ')}
                    />
                  )}
                </Link>
              </SimpleTooltip>
            );
          })}

          {/* 设置按钮 */}
          <SimpleTooltip content={t('nav.settings')}>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className={[
                navBtnBase,
                settingsOpen
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : [
                      'text-[var(--text-secondary)]',
                      'hover:bg-[var(--bg-raised)]',
                      'hover:text-[var(--text)]',
                    ].join(' '),
              ].join(' ')}
            >
              <Settings2 size={16} />
            </button>
          </SimpleTooltip>
        </nav>
      </div>

      {/* 右侧：账户选择 + 主题 + 语言 */}
      <div className="flex items-center gap-2">
        {accounts.length > 0 ? (
          <Select
            value={selectedAccountId}
            onChange={(val) => setActiveAccountId(val)}
            className="h-8 min-w-[120px] text-xs hidden sm:flex"
            options={accounts.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            label={t('nav.accounts')}
          />
        ) : null}

        {/* 主题切换（带日月切换动画） */}
        <SimpleTooltip
          content={t('header.toggleTheme')}
        >
          <button
            type="button"
            onClick={handleToggleTheme}
            className={[
              'flex h-8 w-8 items-center justify-center',
              'rounded-lg transition-all duration-300',
              'text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-raised)]',
              'hover:text-[var(--text)]',
              'active:scale-90',
            ].join(' ')}
          >
            <div className="transition-transform duration-300">
              {isDark ? (
                <Sun size={15} />
              ) : (
                <Moon size={15} />
              )}
            </div>
          </button>
        </SimpleTooltip>

        {/* 语言切换 */}
        <SimpleTooltip
          content={t('header.toggleLanguage')}
        >
          <button
            type="button"
            onClick={handleToggleLanguage}
            className={[
              'flex items-center gap-1 rounded-lg',
              'px-2 py-1.5 text-xs font-medium',
              'transition-all duration-200',
              'text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-raised)]',
              'hover:text-[var(--text)]',
              'active:scale-95',
            ].join(' ')}
          >
            <Languages size={13} />
            <span>
              {locale === 'zh-CN' ? '中文' : 'EN'}
            </span>
          </button>
        </SimpleTooltip>
      </div>

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
