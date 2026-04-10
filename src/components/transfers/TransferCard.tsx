import {
  ArrowDown,
  ArrowUp,
  Link2,
  RotateCw,
  X,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type {
  TransferTask,
  TransferStatus,
} from '@/types/cloud';

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
function TypeIcon({
  type,
}: {
  type: TransferTask['type'];
}) {
  const size = 20;
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
        'rounded-xl bg-[var(--bg)] p-4',
        'transition-all duration-300',
      ].join(' ')}
    >
      {/* 头部：类型图标 + 文件信息 + 状态 + 操作 */}
      <div className="flex items-start gap-3">
        {/* 文件类型图标 */}
        <div
          className={[
            'flex h-10 w-10 shrink-0 items-center',
            'justify-center rounded-lg',
            'bg-[var(--accent)]/10 text-[var(--accent)]',
          ].join(' ')}
        >
          <TypeIcon type={task.type} />
        </div>

        {/* 文件信息和进度 */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-[var(--text)] truncate">
                {task.bucket}/{task.key}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {t(`transfer.${task.type}`)}
              </p>
            </div>

            {/* 状态和操作按钮 */}
            <div className="flex shrink-0 items-center gap-2 ml-2">
              <Badge
                variant={statusVariantMap[task.status]}
              >
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
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Zap
                    size={12}
                    className="text-[var(--accent)]"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    {t('transfer.progress')}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[var(--accent)]">
                  {task.progress}%
                </span>
              </div>
              <div
                className={[
                  'h-1.5 w-full overflow-hidden rounded-full',
                  'bg-[var(--bg-raised)]',
                ].join(' ')}
              >
                <div
                  className={[
                    'h-full rounded-full',
                    'bg-[var(--accent)]',
                    'transition-all duration-300',
                  ].join(' ')}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {/* 失败时显示错误信息 */}
          {task.status === 'failed' &&
          task.errorMessage ? (
            <p className="mt-2 text-xs text-red-500">
              {task.errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
