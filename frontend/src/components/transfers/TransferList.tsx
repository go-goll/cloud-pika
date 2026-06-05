import { useTranslation } from 'react-i18next';
import { TransferCard } from './TransferCard';
import type { TransferTask } from '@/types/cloud';

interface TransferListProps {
  tasks: TransferTask[];
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export function TransferList({
  tasks,
  onCancel,
  onRetry,
}: TransferListProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TransferCard
          key={task.id}
          task={task}
          onCancel={onCancel}
          onRetry={onRetry}
        />
      ))}

      {tasks.length === 0 ? (
        <p className="p-4 text-sm text-[var(--text-secondary)]">
          {t('transfer.empty')}
        </p>
      ) : null}
    </div>
  );
}
