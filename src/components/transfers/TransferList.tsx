<<<<<<< HEAD
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
=======
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { TransferTask } from '@/types/cloud';
>>>>>>> worktree-agent-a58030ba

interface TransferListProps {
  tasks: TransferTask[];
  isLoading?: boolean;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}

<<<<<<< HEAD
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
=======
export function TransferList({
  tasks,
  onCancel,
}: TransferListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <section
          key={task.id}
          className={[
            'rounded-[var(--radius)]',
            'bg-[var(--surface-high)] p-4 shadow-ambient',
          ].join(' ')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {task.bucket}/{task.key}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {task.type}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>
                {t(`transfer.${task.status}`)}
              </Badge>
              {task.status === 'queued'
                || task.status === 'running' ? (
                <Button
                  variant="secondary"
                  onClick={() => onCancel?.(task.id)}
                >
                  {t('transfer.cancel')}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),#82a3ff)] transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </section>
      ))}
      {tasks.length === 0 ? (
        <p className="rounded-[var(--radius)] bg-[var(--surface-high)] p-4 text-sm text-[var(--text-muted)]">
          {t('transfer.empty')}
        </p>
      ) : null}
>>>>>>> worktree-agent-a58030ba
    </div>
  );
}
