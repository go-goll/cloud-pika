import {
  ArrowDown,
  ArrowUp,
  Link2,
  RotateCw,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { TransferTask, TransferStatus } from '@/types/cloud';

interface TransferCardProps {
  task: TransferTask;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}

/** 状态到 Badge variant 的映射 */
const statusVariantMap: Record<
  TransferStatus,
  'muted' | 'default' | 'success' | 'danger' | 'warning'
> = {
  queued: 'muted',
  running: 'default',
  completed: 'success',
  failed: 'danger',
  canceled: 'warning',
};

/** 任务类型图标 */
function TypeIcon({ type }: { type: TransferTask['type'] }) {
  const size = 16;
  switch (type) {
    case 'upload':
      return <ArrowUp size={size} />;
    case 'download':
      return <ArrowDown size={size} />;
    case 'fetch':
      return <Link2 size={size} />;
  }
}

/** 单个传输任务卡片 */
export function TransferCard({
  task,
  onCancel,
  onRetry,
}: TransferCardProps) {
  const { t } = useTranslation();
  const isActive =
    task.status === 'running' || task.status === 'queued';

  return (
    <div
      className={[
        'rounded-[var(--radius)] bg-[var(--surface-high)]',
        'p-4 shadow-ambient transition-all',
      ].join(' ')}
    >
      {/* 头部：类型图标 + 文件信息 + 状态 + 操作 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* 类型图标 */}
          <div
            className={[
              'flex h-8 w-8 shrink-0 items-center',
              'justify-center rounded-full',
              'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]',
              'text-[var(--primary)]',
            ].join(' ')}
          >
            <TypeIcon type={task.type} />
          </div>

          {/* 文件信息 */}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {task.bucket}/{task.key}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {t(`transfer.${task.type}`)}
            </p>
          </div>
        </div>

        {/* 状态和操作按钮 */}
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={statusVariantMap[task.status]}>
            {t(`transfer.${task.status}`)}
          </Badge>

          {isActive ? (
            <Button
              variant="ghost"
              className="h-7 px-2"
              onClick={() => onCancel?.(task.id)}
            >
              <X size={14} />
            </Button>
          ) : null}

          {task.status === 'failed' ? (
            <Button
              variant="ghost"
              className="h-7 px-2"
              onClick={() => onRetry?.(task.id)}
            >
              <RotateCw size={14} />
              <span className="ml-1 text-xs">
                {t('transfer.retry')}
              </span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* 进度条（仅运行中显示） */}
      {task.status === 'running' ? (
        <div
          className={[
            'mt-3 h-1.5 overflow-hidden rounded-full',
            'bg-[var(--surface-elevated)]',
          ].join(' ')}
        >
          <div
            className={[
              'h-full rounded-full transition-all',
              'bg-[linear-gradient(90deg,var(--primary),var(--primary-soft))]',
              'animate-shimmer',
            ].join(' ')}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      ) : null}

      {/* 失败时显示错误信息 */}
      {task.status === 'failed' && task.errorMessage ? (
        <p className="mt-2 text-xs text-[var(--danger)]">
          {task.errorMessage}
        </p>
      ) : null}
    </div>
  );
}
