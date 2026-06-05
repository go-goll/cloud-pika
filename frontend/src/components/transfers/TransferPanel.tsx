import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp } from 'lucide-react';
import { TransferList } from './TransferList';
import {
  useCancelTransferMutation,
  useTransfersQuery,
} from '@/hooks/useCloudApi';
import { useTransferStore } from '@/stores/useTransferStore';

/**
 * 底部可折叠传输面板
 * 当存在传输任务时自动显示，无任务时隐藏
 */
export function TransferPanel() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const query = useTransfersQuery();
  const cancelMutation = useCancelTransferMutation();
  const transfers = useTransferStore((s) => s.transfers);
  const setTransfers = useTransferStore(
    (s) => s.setTransfers,
  );

  useEffect(() => {
    if (query.data) {
      setTransfers(query.data);
    }
  }, [query.data, setTransfers]);

  const activeTransfers = useMemo(
    () =>
      transfers.filter(
        (t) =>
          t.status === 'queued' || t.status === 'running',
      ),
    [transfers],
  );

  const averageProgress = useMemo(() => {
    if (activeTransfers.length === 0) return 0;
    const total = activeTransfers.reduce(
      (sum, t) => sum + t.progress,
      0,
    );
    return Math.round(total / activeTransfers.length);
  }, [activeTransfers]);

  if (transfers.length === 0) {
    return null;
  }

  return (
    <div
      className={[
        'shrink-0 rounded-2xl',
        'bg-[var(--bg-card)] border border-[var(--border)]',
      ].join(' ')}
    >
      {/* 折叠栏 */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={[
          'flex w-full items-center justify-between',
          'h-10 px-4 rounded-xl',
          'text-xs text-[var(--text-secondary)]',
          'hover:text-[var(--text)]',
          'transition-colors',
        ].join(' ')}
      >
        <span className="flex items-center gap-2">
          <ChevronUp
            size={14}
            className={[
              'transition-transform duration-200',
              expanded ? 'rotate-180' : '',
            ].join(' ')}
          />
          <span className="font-medium">
            {t('transfer.title')} ({activeTransfers.length})
          </span>
        </span>

        {/* 渐变进度条 */}
        {activeTransfers.length > 0 && (
          <div
            className={[
              'h-1.5 w-32 overflow-hidden rounded-full',
              'bg-[var(--bg-raised)]',
            ].join(' ')}
          >
            <div
              className={[
                'h-full rounded-full',
                'bg-[var(--accent)]',
                'transition-all duration-500 ease-out',
              ].join(' ')}
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        )}
      </button>

      {/* 展开内容 */}
      {expanded && (
        <div
          className={[
            'h-60 overflow-y-auto',
            'border-t border-[var(--border)]',
            'p-3',
            'animate-slide-in-up',
          ].join(' ')}
        >
          <TransferList
            tasks={transfers}
            onCancel={(id) =>
              void cancelMutation.mutateAsync(id)
            }
          />
        </div>
      )}
    </div>
  );
}
