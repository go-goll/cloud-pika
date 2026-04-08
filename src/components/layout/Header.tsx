import { RefreshCcw, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

const titleMap: Record<string, string> = {
  '/login': 'nav.accounts',
  '/bucket': 'nav.explorer',
  '/transfers': 'nav.transfer',
  '/settings': 'nav.settings',
};

/** 顶部头部栏，包含页面标题和操作按钮 */
export function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const inBucketPage = pathname.startsWith('/bucket');

  return (
    <header
      className={[
        'glass sticky top-0 z-30 flex h-16 items-center',
        'justify-between border-b border-transparent px-6',
      ].join(' ')}
    >
      <div>
        <h2 className="font-display text-lg font-semibold">
          {t(titleMap[pathname] ?? 'nav.explorer')}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* 刷新按钮 */}
        <Button
          variant="secondary"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('cloud-pika:refresh-active'),
            )
          }
          disabled={!inBucketPage}
          title={t('common.refresh')}
        >
          <RefreshCcw size={16} className="mr-2" />
          {t('common.refresh')}
        </Button>

        {/* 上传按钮 */}
        <Button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('cloud-pika:upload-active'),
            )
          }
          disabled={!inBucketPage}
          title={t('bucket.upload')}
        >
          <Rocket size={16} className="mr-2" />
          {t('bucket.upload')}
        </Button>
      </div>
    </header>
  );
}
