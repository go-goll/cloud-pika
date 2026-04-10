import {
  CheckCircle,
  Clock,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import type {
  TransferTask,
  TransferStatus,
} from '@/types/cloud';

interface TransferStatsProps {
  tasks: TransferTask[];
  onClearCompleted?: () => void;
}

/** 统计项图标和颜色配置 */
const statConfig: Record<
  TransferStatus,
  { icon: typeof PlayCircle; colorClass: string }
> = {
  running: {
    icon: PlayCircle,
    colorClass: 'text-[var(--accent)]',
  },
  queued: {
    icon: Clock,
    colorClass: 'text-[var(--text-secondary)]',
  },
  completed: {
    icon: CheckCircle,
    colorClass: 'text-green-500',
  },
  failed: {
    icon: XCircle,
    colorClass: 'text-red-500',
  },
  canceled: {
    icon: XCircle,
    colorClass: 'text-[var(--text-secondary)]',
  },
};

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
    {
      key: 'completed',
      labelKey: 'transfer.completed',
    },
    { key: 'failed', labelKey: 'transfer.failed' },
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-4">
        {statItems.map((item) => {
          const count = counts[item.key] ?? 0;
          if (count === 0) return null;
          const config = statConfig[item.key];
          const Icon = config.icon;
          return (
            <div
              key={item.key}
              className={[
                'flex items-center gap-3',
                'rounded-2xl bg-[var(--bg-card)]',
                'border border-[var(--border)] p-5',
              ].join(' ')}
            >
              <Icon
                size={16}
                className={config.colorClass}
              />
              <div>
                <span
                  className={[
                    'block text-[10px] uppercase',
                    'tracking-[0.05em] font-bold',
                    'text-[var(--text-secondary)]',
                  ].join(' ')}
                >
                  {t(item.labelKey)}
                </span>
                <span className="text-2xl font-bold text-[var(--text)]">
                  {count}
                </span>
              </div>
            </div>
          );
        })}
        {tasks.length === 0 ? (
          <span className="text-sm text-[var(--text-secondary)]">
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
