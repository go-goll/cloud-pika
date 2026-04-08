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
    colorClass: 'text-primary',
  },
  queued: {
    icon: Clock,
    colorClass: 'text-on-surface-variant',
  },
  completed: {
    icon: CheckCircle,
    colorClass: 'text-success',
  },
  failed: {
    icon: XCircle,
    colorClass: 'text-danger',
  },
  canceled: {
    icon: XCircle,
    colorClass: 'text-on-surface-variant',
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
                'flex items-center gap-2',
                'rounded-xl ghost-border px-4 py-2',
              ].join(' ')}
            >
              <Icon
                size={16}
                className={config.colorClass}
              />
              <span className="text-sm text-on-surface-variant">
                {t(item.labelKey)}
              </span>
              <span className="text-2xl font-headline font-bold text-on-surface">
                {count}
              </span>
            </div>
          );
        })}
        {tasks.length === 0 ? (
          <span className="text-sm text-on-surface-variant">
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
