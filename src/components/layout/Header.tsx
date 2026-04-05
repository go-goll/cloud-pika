import { RefreshCcw, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAccountStore } from '@/stores/useAccountStore';

const titleMap: Record<string, string> = {
  '/bucket': 'nav.explorer',
  '/transfers': 'nav.transfer',
  '/settings': 'nav.settings',
};

export function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const accounts = useAccountStore((s) => s.accounts);
  const inBucketPage = pathname.startsWith('/bucket');

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-transparent px-6">
      <div>
        <h2 className="font-display text-lg font-semibold">
          {t(titleMap[pathname] ?? 'nav.explorer')}
        </h2>
        <p className="text-xs text-[var(--text-muted)]">{accounts.length} account(s) connected</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => window.dispatchEvent(new CustomEvent('cloud-pika:refresh-active'))}
          disabled={!inBucketPage}
        >
          <RefreshCcw size={16} className="mr-2" />
          {t('common.refresh')}
        </Button>
        <Button
          onClick={() => window.dispatchEvent(new CustomEvent('cloud-pika:upload-active'))}
          disabled={!inBucketPage}
        >
          <Rocket size={16} className="mr-2" />
          {t('bucket.upload')}
        </Button>
      </div>
    </header>
  );
}
