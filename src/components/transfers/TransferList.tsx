import { useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TransferCard } from './TransferCard';
import type {
  TransferTask,
  TransferStatus,
} from '@/types/cloud';

interface TransferListProps {
  tasks: TransferTask[];
  isLoading?: boolean;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}

/** 状态排序权重：running > queued > failed > completed > canceled */
const statusOrder: Record<TransferStatus, number> = {
  running: 0,
  queued: 1,
  failed: 2,
  completed: 3,
  canceled: 4,
};

/** 传输任务列表，按状态排序展示 */
export function TransferList({
  tasks,
  isLoading,
  onCancel,
  onRetry,
}: TransferListProps) {
  const { t } = useTranslation();

  /** 按状态优先级排序 */
  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (a, b) =>
          statusOrder[a.status] -
          statusOrder[b.status],
      ),
    [tasks],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (sortedTasks.length === 0) {
    return (
      <EmptyState
        icon={<ArrowUpDown size={32} />}
        title={t('transfer.noTransfers')}
        description={t('transfer.noTransfersDesc')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {sortedTasks.map((task) => (
        <TransferCard
          key={task.id}
          task={task}
          onCancel={onCancel}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}
