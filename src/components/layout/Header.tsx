import { RefreshCcw, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SimpleTooltip } from '@/components/ui/Tooltip';
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
  const activeAccountId = useAccountStore(
    (s) => s.activeAccountId,
  );
  const setActiveAccountId = useAccountStore(
    (s) => s.setActiveAccountId,
  );
  const inBucketPage = pathname.startsWith('/bucket');
  const selectedAccountId =
    activeAccountId || accounts[0]?.id || '';

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
          {accounts.length} account(s) connected
        </p>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-2">
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

        {/* 窄窗口下隐藏文字，只保留图标 */}
        <SimpleTooltip content={t('nav.accounts')}>
          <Button
            variant="secondary"
            onClick={() => navigate('/login')}
            className="hidden sm:inline-flex"
          >
            {t('nav.accounts')}
          </Button>
        </SimpleTooltip>

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
