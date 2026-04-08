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
  const size = 24;
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
        'bg-surface-container-lowest rounded-xl p-6',
        'ghost-border hover:shadow-sm',
        'transition-all duration-300',
      ].join(' ')}
    >
      {/* 头部：类型图标 + 文件信息 + 状态 + 操作 */}
      <div className="flex items-start gap-5">
        {/* 类型图标 */}
        <div
          className={[
            'flex h-12 w-12 shrink-0 items-center',
            'justify-center rounded-xl',
            'bg-primary/10 text-primary',
          ].join(' ')}
        >
          <TypeIcon type={task.type} />
        </div>

        {/* 文件信息和进度 */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-bold text-on-surface truncate">
                {task.bucket}/{task.key}
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t(`transfer.${task.type}`)}
              </p>
            </div>

            {/* 状态和操作按钮 */}
            <div className="flex shrink-0 items-center gap-2">
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
            <>
              <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden mb-4">
                <div
                  className="h-full signature-gradient rounded-full transition-all"
                  style={{
                    width: `${task.progress}%`,
                  }}
                />
              </div>

              {/* 进度百分比 */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Zap
                    size={14}
                    className="text-primary"
                  />
                  <span className="text-xs font-medium text-on-surface">
                    {task.progress}%
                  </span>
                </div>
              </div>
            </>
          ) : null}

          {/* 失败时显示错误信息 */}
          {task.status === 'failed' &&
          task.errorMessage ? (
            <p className="mt-2 text-xs text-danger">
              {task.errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
