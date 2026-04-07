import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { TransferList } from '@/components/transfers/TransferList';
import { TransferStats } from '@/components/transfers/TransferStats';
import {
  useCancelTransferMutation,
  useTransfersQuery,
} from '@/hooks/useCloudApi';
import { useTransferStore } from '@/stores/useTransferStore';

/** 传输任务页面 */
export function TransfersPage() {
  const { t } = useTranslation();
  const query = useTransfersQuery();
  const cancelMutation = useCancelTransferMutation();
  const transfers = useTransferStore((s) => s.transfers);
  const setTransfers = useTransferStore(
    (s) => s.setTransfers,
  );

  // 同步后端数据到本地状态
  useEffect(() => {
    if (query.data) {
      setTransfers(query.data);
    }
  }, [query.data, setTransfers]);

  /** 清除已完成的任务（仅本地过滤） */
  const handleClearCompleted = () => {
    setTransfers(
      transfers.filter((t) => t.status !== 'completed'),
    );
  };

  return (
    <section className="space-y-4">
      {/* 标题 + 统计 */}
      <Card>
        <h3 className="font-display text-2xl font-semibold">
          {t('transfer.title')}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {t('transfer.subtitle')}
        </p>
        <div className="mt-3">
          <TransferStats
            tasks={transfers}
            onClearCompleted={handleClearCompleted}
          />
        </div>
      </Card>

      {/* 任务列表 */}
      <TransferList
        tasks={transfers}
        isLoading={query.isLoading}
        onCancel={(id) =>
          void cancelMutation.mutateAsync(id)
        }
      />
    </section>
  );
}
