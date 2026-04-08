import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const transfers = useTransferStore(
    (s) => s.transfers,
  );
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
      transfers.filter(
        (t) => t.status !== 'completed',
      ),
    );
  };

  return (
    <section className="space-y-8">
      {/* 页面标题 */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface font-headline">
            {t('transfer.title')}
          </h2>
          <p className="text-on-surface-variant mt-2 font-medium">
            {t('transfer.subtitle')}
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <TransferStats
        tasks={transfers}
        onClearCompleted={handleClearCompleted}
      />

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
