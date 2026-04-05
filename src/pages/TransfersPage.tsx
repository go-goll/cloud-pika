import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { TransferList } from '@/components/transfers/TransferList';
import { useCancelTransferMutation, useTransfersQuery } from '@/hooks/useCloudApi';
import { useTransferStore } from '@/stores/useTransferStore';

export function TransfersPage() {
  const { t } = useTranslation();
  const query = useTransfersQuery();
  const cancelMutation = useCancelTransferMutation();
  const transfers = useTransferStore((s) => s.transfers);
  const setTransfers = useTransferStore((s) => s.setTransfers);

  useEffect(() => {
    if (query.data) {
      setTransfers(query.data);
    }
  }, [query.data, setTransfers]);

  return (
    <section className="space-y-4">
      <Card>
        <h3 className="font-display text-2xl font-semibold">{t('transfer.title')}</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Queue and historical events are synced by SSE + periodic polling.
        </p>
      </Card>
      <TransferList tasks={transfers} onCancel={(id) => void cancelMutation.mutateAsync(id)} />
    </section>
  );
}
