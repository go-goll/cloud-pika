import { RefreshCcw, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useAccountStore } from '@/stores/useAccountStore';

const titleMap: Record<string, string> = {
  '/login': 'nav.accounts',
  '/bucket': 'nav.explorer',
  '/transfers': 'nav.transfer',
  '/settings': 'nav.settings',
};

export function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const accounts = useAccountStore((s) => s.accounts);
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const setActiveAccountId = useAccountStore((s) => s.setActiveAccountId);
  const inBucketPage = pathname.startsWith('/bucket');
  const selectedAccountId = activeAccountId || accounts[0]?.id || '';

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-transparent px-6">
      <div>
        <h2 className="font-display text-lg font-semibold">
          {t(titleMap[pathname] ?? 'nav.explorer')}
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          {t('header.connectedAccounts', {
            count: accounts.length,
          })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {accounts.length > 0 ? (
          <Select
            value={selectedAccountId}
            onChange={(val) => setActiveAccountId(val)}
            className="h-9 min-w-[180px]"
            options={accounts.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            label={t('nav.accounts')}
          />
        ) : null}
        <Button variant="secondary" onClick={() => navigate('/login')}>
          {t('nav.accounts')}
        </Button>
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
