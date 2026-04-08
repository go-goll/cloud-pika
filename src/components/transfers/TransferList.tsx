import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { TransferTask } from '@/types/cloud';

interface TransferListProps {
  tasks: TransferTask[];
  onCancel?: (id: string) => void;
}

export function TransferList({
  tasks,
  onCancel,
}: TransferListProps) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isActive =
          task.status === 'queued'
          || task.status === 'running';

        return (
          <section
            key={task.id}
            className={
              'animate-row-in '
              + 'rounded-[var(--radius)] '
              + 'bg-[var(--surface-high)] p-4 shadow-ambient'
            }
          >
            {/* 窄窗口下堆叠排列 */}
            <div
              className={
                'flex flex-col gap-2 '
                + 'sm:flex-row sm:items-center '
                + 'sm:justify-between'
              }
            >
              {/* 文件信息 */}
              <div className="min-w-0">
                <p
                  className={
                    'truncate text-sm font-medium'
                  }
                >
                  {task.bucket}/{task.key}
                </p>
                <p
                  className={
                    'mt-1 text-xs text-[var(--text-muted)]'
                  }
                >
                  {task.type}
                </p>
              </div>

              {/* 状态和操作 */}
              <div
                className={
                  'flex shrink-0 items-center gap-2'
                }
              >
                <Badge>{task.status}</Badge>
                {isActive ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onCancel?.(task.id)}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>

            {/* 进度条（运行中带 shimmer 效果） */}
            <div
              className={
                'mt-3 h-2 overflow-hidden '
                + 'rounded-full bg-[var(--surface-elevated)]'
              }
            >
              <div
                className={[
                  'h-full rounded-full transition-all',
                  isActive
                    ? 'progress-shimmer'
                    : 'bg-[linear-gradient(90deg,'
                      + 'var(--primary),#82a3ff)]',
                ].join(' ')}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </section>
        );
      })}

      {tasks.length === 0 ? (
        <p
          className={
            'rounded-[var(--radius)] '
            + 'bg-[var(--surface-high)] p-4 text-sm '
            + 'text-[var(--text-muted)]'
          }
        >
          No transfers yet.
        </p>
      ) : null}
    </div>
  );
}
