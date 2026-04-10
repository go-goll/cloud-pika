import { useEffect, useState } from 'react';
import {
  Languages,
  Moon,
  Settings2,
  Sun,
  User,
} from 'lucide-react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { AccountDialog } from '@/components/account/AccountDialog';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { SimpleTooltip } from '@/components/ui/Tooltip';
import { useAppStore } from '@/stores/useAppStore';
import { useAccountStore } from '@/stores/useAccountStore';

/** 路由路径到页面标题的映射 */
const pageTitleMap: Record<string, string> = {
  '/bucket': 'nav.explorer',
  '/shared': 'nav.shared',
  '/starred': 'nav.starred',
  '/trash': 'nav.trash',
};

/** 顶部导航栏：页面标题 + 全局操作（主题/语言/设置/账户） */
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

  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

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

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  /** 根据当前路径获取页面标题 */
  const getPageTitle = () => {
    const matchedKey = Object.keys(pageTitleMap).find((path) =>
      pathname.startsWith(path),
    );
    return matchedKey ? t(pageTitleMap[matchedKey]) : '';
  };

  return (
    <header
      className={[
        'glass sticky top-0 z-30',
        'flex h-14 items-center justify-between',
        'border-b border-[var(--border)]/50 px-5',
      ].join(' ')}
    >
      {/* 左侧：页面标题 */}
      <h1 className="text-base font-semibold">
        {getPageTitle()}
      </h1>

      {/* 右侧：主题 + 语言 + 设置 + 用户 */}
      <div className="flex items-center gap-1.5">
        {/* 主题切换 */}
        <SimpleTooltip content={t('header.toggleTheme')}>
          <button
            type="button"
            onClick={handleToggleTheme}
            className={[
              'flex h-8 w-8 items-center justify-center',
              'rounded-lg transition-all duration-300',
              'text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-raised)] hover:text-[var(--text)]',
              'active:scale-90',
            ].join(' ')}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </SimpleTooltip>

        {/* 语言切换 */}
        <SimpleTooltip content={t('header.toggleLanguage')}>
          <button
            type="button"
            onClick={handleToggleLanguage}
            className={[
              'flex items-center gap-1 rounded-lg',
              'px-2 py-1.5 text-xs font-medium',
              'transition-all duration-200',
              'text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-raised)] hover:text-[var(--text)]',
              'active:scale-95',
            ].join(' ')}
          >
            <Languages size={13} />
            <span>{locale === 'zh-CN' ? '中文' : 'EN'}</span>
          </button>
        </SimpleTooltip>

        {/* 设置按钮 */}
        <SimpleTooltip content={t('nav.settings')}>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
              settingsOpen
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            <Settings2 size={15} />
          </button>
        </SimpleTooltip>

        {/* 账户/用户头像 */}
        <SimpleTooltip content={t('header.manageAccounts')}>
          <button
            type="button"
            onClick={() => setAccountDialogOpen(true)}
            className={[
              'flex h-8 w-8 items-center justify-center',
              'rounded-full bg-[var(--accent)] text-[var(--accent-text)]',
              'transition-transform hover:scale-105 active:scale-95',
            ].join(' ')}
          >
            <User size={14} />
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
