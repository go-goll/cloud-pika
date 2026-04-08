import {
  Languages,
  Moon,
  RefreshCcw,
  Rocket,
  Sun,
} from 'lucide-react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/useAppStore';

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
  const inBucketPage = pathname.startsWith('/bucket');

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
      className={[
        'glass-panel ghost-border',
        'border-l-0 border-r-0 border-t-0',
        'sticky top-0 z-30',
        'flex h-14 items-center justify-between px-6',
      ].join(' ')}
    >
      {/* 左侧：页面标题 */}
      <h2
        className={[
          'font-display text-lg font-semibold',
          'text-[var(--color-on-surface)]',
        ].join(' ')}
      >
        {t(titleMap[pathname] ?? 'nav.explorer')}
      </h2>

      {/* 右侧：操作按钮组 */}
      <div className="flex items-center gap-2">
        {/* 主题切换 */}
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
          title={t('header.toggleTheme')}
        >
          {isDark ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>

        {/* 语言切换 */}
        <button
          type="button"
          onClick={handleToggleLanguage}
          className={[
            'flex items-center gap-1.5 rounded-lg',
            'px-2.5 py-1.5 text-xs font-medium',
            'ghost-border transition-all duration-200',
            'text-[var(--color-on-surface-variant)]',
            'hover:bg-[var(--color-surface-container-low)]',
            'hover:text-[var(--color-on-surface)]',
          ].join(' ')}
          title={t('header.toggleLanguage')}
        >
          <Languages size={14} />
          <span>
            {locale === 'zh-CN' ? '中文' : 'EN'}
          </span>
        </button>

        {/* 分隔符 */}
        <div className="mx-1 h-5 w-px bg-[var(--color-outline-variant)]" />

        {/* 刷新按钮 */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent(
                'cloud-pika:refresh-active',
              ),
            )
          }
          disabled={!inBucketPage}
          title={t('common.refresh')}
        >
          <RefreshCcw size={14} className="mr-1.5" />
          {t('common.refresh')}
        </Button>

        {/* 上传按钮 */}
        <Button
          size="sm"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent(
                'cloud-pika:upload-active',
              ),
            )
          }
          disabled={!inBucketPage}
          title={t('bucket.upload')}
        >
          <Rocket size={14} className="mr-1.5" />
          {t('bucket.upload')}
        </Button>
      </div>
    </header>
  );
}
