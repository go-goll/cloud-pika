import { useMemo } from 'react';
import {
  ClipboardCopy,
  Download,
  FolderCog,
  RefreshCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useProviderFeaturesQuery } from '@/hooks/useCloudApi';
import { formatFileSize } from '@/lib/format';
import { useAccountStore } from '@/stores/useAccountStore';
import { useBucketStore } from '@/stores/useBucketStore';
import { useTransferStore } from '@/stores/useTransferStore';

function emit(name: string) {
  window.dispatchEvent(new Event(name));
}

export function AppInspector() {
  const { t } = useTranslation();
  const activeBucket = useBucketStore((s) => s.activeBucket);
  const objects = useBucketStore((s) => s.objects);
  const selectedKeys = useBucketStore((s) => s.selectedKeys);
  const clearSelection = useBucketStore((s) => s.clearSelection);
  const transfers = useTransferStore((s) => s.transfers);
  const activeAccountId = useAccountStore((s) => s.activeAccountId);

  const features = useProviderFeaturesQuery(
    activeAccountId,
    Boolean(activeAccountId),
  );
  const hasRefreshCDN = (features.data ?? []).includes('refreshCDN');

  const selectedObjects = useMemo(
    () => objects.filter((item) => selectedKeys.has(item.key)),
    [objects, selectedKeys],
  );
  const selectedSize = selectedObjects.reduce(
    (sum, item) => sum + (item.isDir ? 0 : item.size ?? 0),
    0,
  );
  const latestTransfers = transfers.slice(0, 4);
  const selectedCount = selectedKeys.size;

  return (
    <aside className="hidden min-h-0 border-l border-[var(--border)] bg-[var(--bg-card)] p-3 min-[1200px]:flex min-[1200px]:flex-col">
      <section className="atlas-panel p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
              {t('inspector.bucket')}
            </p>
            <h2 className="mt-1 truncate text-base font-semibold">
              {activeBucket || t('bucket.emptyBucket')}
            </h2>
          </div>
          <Button
            variant="ghost"
            iconOnly
            onClick={() => emit('cloud-pika:open-bucket-settings')}
            title={t('bucketSettings.title')}
            aria-label={t('bucketSettings.title')}
          >
            <FolderCog size={15} />
          </Button>
        </div>
      </section>

      <section className="atlas-panel mt-3 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
              {t('inspector.selection')}
            </p>
            <p className="mt-1 text-sm font-semibold">
              {t('bucket.selectedCount', { count: selectedCount })}
            </p>
          </div>
          {selectedCount > 0 ? (
            <Button
              variant="ghost"
              iconOnly
              onClick={clearSelection}
              title={t('bucket.clearSelection')}
              aria-label={t('bucket.clearSelection')}
            >
              <X size={15} />
            </Button>
          ) : null}
        </div>
        <div className="mt-3 rounded-[8px] bg-[var(--bg-raised)] p-2 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-[var(--text-secondary)]">
              {t('metrics.visibleSize')}
            </span>
            <span className="font-semibold">{formatFileSize(selectedSize)}</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            disabled={selectedCount === 0}
            onClick={() => emit('cloud-pika:batch-copy-url')}
          >
            <ClipboardCopy size={14} className="mr-1.5" />
            {t('bucket.copyUrl')}
          </Button>
          <Button
            variant="secondary"
            disabled={selectedCount === 0}
            onClick={() => emit('cloud-pika:batch-download')}
          >
            <Download size={14} className="mr-1.5" />
            {t('bucket.download')}
          </Button>
          {hasRefreshCDN ? (
            <Button
              variant="ghost"
              disabled={selectedCount === 0}
              onClick={() => emit('cloud-pika:batch-refresh-cdn')}
            >
              <RefreshCcw size={14} className="mr-1.5" />
              {t('bucket.refreshCDN')}
            </Button>
          ) : null}
          <Button
            variant="danger"
            className={hasRefreshCDN ? undefined : 'col-span-2'}
            disabled={selectedCount === 0}
            onClick={() => emit('cloud-pika:batch-delete')}
          >
            <Trash2 size={14} className="mr-1.5" />
            {t('bucket.delete')}
          </Button>
        </div>
      </section>

      <section className="atlas-panel mt-3 min-h-0 flex-1 overflow-hidden p-3">
        <p className="text-sm font-semibold">{t('transfer.title')}</p>
        <div className="mt-3 space-y-2 overflow-y-auto pr-1">
          {latestTransfers.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">
              {t('transfer.empty')}
            </p>
          ) : (
            latestTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="rounded-[8px] bg-[var(--bg-raised)] p-2 text-xs"
              >
                <div className="flex justify-between gap-2">
                  <span className="truncate font-medium">{transfer.key}</span>
                  <span className="text-[var(--text-secondary)]">
                    {t(`transfer.${transfer.status}`)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-[var(--border)]">
                  <div
                    className="h-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(4, transfer.progress ?? 0)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
