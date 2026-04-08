import {
  Languages,
  Moon,
  RefreshCcw,
  Rocket,
  Sun,
} from 'lucide-react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SimpleTooltip } from '@/components/ui/Tooltip';
import { useAppStore } from '@/stores/useAppStore';
import { useAccountStore } from '@/stores/useAccountStore';

/** 路由 → 标题 i18n 映射 */
const titleMap: Record<string, string> = {
  '/login': 'nav.accounts',
  '/bucket': 'nav.explorer',
  '/transfers': 'nav.transfer',
  '/settings': 'nav.settings',
};

/** 顶部头部栏：毛玻璃背景、页面标题、操作按钮组 */
export function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inBucketPage = pathname.startsWith('/bucket');

  const accounts = useAccountStore((s) => s.accounts);
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

  /** 切换深色/浅色主题 */
  const handleToggleTheme = () => {
    const next =
      themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  };

  /** 切换中文/英文 */
  const handleToggleLanguage = () => {
    const next =
      locale === 'zh-CN' ? 'en-US' : 'zh-CN';
    setLocale(next);
    void i18n.changeLanguage(next);
  };

  /** 判断当前是否为深色 */
  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches);

  return (
    <header
      className={
        'glass sticky top-0 z-30 flex h-16 '
        + 'items-center justify-between '
        + 'border-b border-transparent px-4 sm:px-6'
      }
    >
      {/* 左侧标题 */}
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold">
          {t(titleMap[pathname] ?? 'nav.explorer')}
        </h2>
        <p className="truncate text-xs text-[var(--text-muted)]">
          {t('header.connectedAccounts', {
            count: accounts.length,
          })}
        </p>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-2">
        {/* 账户选择器（窄窗口隐藏） */}
        {accounts.length > 0 ? (
          <Select
            value={selectedAccountId}
            onChange={(val) => setActiveAccountId(val)}
            className="hidden h-9 min-w-[140px] sm:flex"
            options={accounts.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            label={t('nav.accounts')}
          />
        ) : null}

        {/* 主题切换 */}
        <SimpleTooltip
          content={t('header.toggleTheme')}
        >
          <button
            type="button"
            onClick={handleToggleTheme}
            className={[
              'flex h-9 w-9 items-center justify-center',
              'rounded-lg transition-all duration-200',
              'text-[var(--color-on-surface-variant)]',
              'hover:bg-[var(--color-surface-container-low)]',
              'hover:text-[var(--color-on-surface)]',
            ].join(' ')}
          >
            {isDark ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
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
              'flex items-center gap-1.5 rounded-lg',
              'px-2.5 py-1.5 text-xs font-medium',
              'transition-all duration-200',
              'text-[var(--color-on-surface-variant)]',
              'hover:bg-[var(--color-surface-container-low)]',
              'hover:text-[var(--color-on-surface)]',
            ].join(' ')}
          >
            <Languages size={14} />
            <span>
              {locale === 'zh-CN' ? '中文' : 'EN'}
            </span>
          </button>
        </SimpleTooltip>

        {/* 账户管理（窄窗口隐藏文字） */}
        <SimpleTooltip content={t('nav.accounts')}>
          <Button
            variant="secondary"
            onClick={() => navigate('/login')}
            className="hidden sm:inline-flex"
          >
            {t('nav.accounts')}
          </Button>
        </SimpleTooltip>

        {/* 刷新 */}
        <SimpleTooltip content={t('common.refresh')}>
          <Button
            variant="secondary"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent(
                  'cloud-pika:refresh-active',
                ),
              )
            }
            disabled={!inBucketPage}
            iconOnly
          >
            <RefreshCcw size={16} />
          </Button>
        </SimpleTooltip>

        {/* 上传 */}
        <SimpleTooltip content={t('bucket.upload')}>
          <Button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent(
                  'cloud-pika:upload-active',
                ),
              )
            }
            disabled={!inBucketPage}
          >
            <Rocket size={16} />
            <span className="ml-2 hidden sm:inline">
              {t('bucket.upload')}
            </span>
          </Button>
        </SimpleTooltip>
      </div>
    </header>
  );
}
