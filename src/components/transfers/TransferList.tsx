import { useTranslation } from 'react-i18next';
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
    </div>
  );
}
