import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import type { TransferTask, TransferStatus } from '@/types/cloud';

interface TransferStatsProps {
  tasks: TransferTask[];
  onClearCompleted?: () => void;
}

/** 传输任务统计栏 */
export function TransferStats({
  tasks,
  onClearCompleted,
}: TransferStatsProps) {
  const { t } = useTranslation();

  /** 按状态统计数量 */
  const counts = tasks.reduce<Record<string, number>>(
    (acc, task) => {
      acc[task.status] = (acc[task.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const completedCount = counts.completed ?? 0;

  /** 统计项配置 */
  const statItems: Array<{
    key: TransferStatus;
    labelKey: string;
  }> = [
    { key: 'running', labelKey: 'transfer.running' },
    { key: 'queued', labelKey: 'transfer.queued' },
    { key: 'completed', labelKey: 'transfer.completed' },
    { key: 'failed', labelKey: 'transfer.failed' },
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-3 text-sm">
        {statItems.map((item) => {
          const count = counts[item.key] ?? 0;
          if (count === 0) return null;
          return (
            <span
              key={item.key}
              className="text-[var(--text-muted)]"
            >
              {t(item.labelKey)}{' '}
              <span className="font-medium text-[var(--text)]">
                {count}
              </span>
            </span>
          );
        })}
        {tasks.length === 0 ? (
          <span className="text-[var(--text-muted)]">
            {t('transfer.noTransfers')}
          </span>
        ) : null}
      </div>

      {completedCount > 0 ? (
        <Button
          variant="ghost"
          className="text-xs"
          onClick={onClearCompleted}
        >
          {t('transfer.clearCompleted')}
        </Button>
      ) : null}
    </div>
  );
}
