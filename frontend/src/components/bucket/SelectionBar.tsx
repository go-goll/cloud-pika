/**
 * SelectionBar - 批量操作浮动栏组件
 * 当有文件被选中时从底部滑入；仅在检查器隐藏（<1200px）时作为紧凑批量入口，由 BucketPage 控制可见性
 */
import { useTranslation } from 'react-i18next';
import {
  Copy,
  Download,
  RefreshCcw,
  Trash2,
  X,
} from 'lucide-react';
import { SimpleTooltip } from '@/components/ui/Tooltip';

interface SelectionBarProps {
  count: number;
  onBatchDownload: () => void;
  onBatchCopyUrl: () => void;
  onBatchRefreshCDN?: () => void;
  onBatchPrefetchCDN?: () => void;
  onBatchDelete?: () => void;
  onClearSelection: () => void;
}

export function SelectionBar({
  count,
  onBatchDownload,
  onBatchCopyUrl,
  onBatchRefreshCDN,
  onBatchPrefetchCDN,
  onBatchDelete,
  onClearSelection,
}: SelectionBarProps) {
  const { t } = useTranslation();

  if (count === 0) return null;

  return (
    <div
      className={[
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3',
        'max-w-[calc(100vw-2rem)]',
        'rounded-[8px] atlas-panel',
        'px-5 py-2.5',
        'shadow-xl',
        'border border-[var(--border)]',
        'animate-[slideUp_0.25s_ease-out]',
      ].join(' ')}
    >
      {/* 选中计数 badge */}
      <span
        className={[
          'shrink-0 bg-[var(--accent)] text-white',
          'rounded-[8px] px-3 py-1',
          'text-sm font-medium whitespace-nowrap',
        ].join(' ')}
      >
        {t('bucket.selectedCount', { count })}
      </span>

      {/* 操作按钮 */}
      <SimpleTooltip content={t('bucket.copyUrl')}>
        <button
          type="button"
          onClick={onBatchCopyUrl}
          aria-label={t('bucket.copyUrl')}
          className={[
            'flex items-center gap-1.5 shrink-0',
            'text-sm text-[var(--text-secondary)]',
            'hover:text-[var(--text)]',
            'transition-colors px-2 py-1.5 rounded-[8px]',
          ].join(' ')}
        >
          <Copy size={14} />
          <span className="hidden sm:inline whitespace-nowrap">
            {t('bucket.copyUrl')}
          </span>
        </button>
      </SimpleTooltip>

      {onBatchRefreshCDN ? (
        <SimpleTooltip content={t('bucket.refreshCDN')}>
          <button
            type="button"
            onClick={onBatchRefreshCDN}
            aria-label={t('bucket.refreshCDN')}
            className={[
              'flex items-center gap-1.5 shrink-0',
              'text-sm text-[var(--text-secondary)]',
              'hover:text-[var(--text)]',
              'transition-colors px-2 py-1.5 rounded-[8px]',
            ].join(' ')}
          >
            <RefreshCcw size={14} />
            <span className="hidden sm:inline whitespace-nowrap">
              {t('bucket.refreshCDN')}
            </span>
          </button>
        </SimpleTooltip>
      ) : null}

      {onBatchPrefetchCDN ? (
        <SimpleTooltip content={t('bucket.prefetchCDN')}>
          <button
            type="button"
            onClick={onBatchPrefetchCDN}
            aria-label={t('bucket.prefetchCDN')}
            className={[
              'flex items-center gap-1.5 shrink-0',
              'text-sm text-[var(--text-secondary)]',
              'hover:text-[var(--text)]',
              'transition-colors px-2 py-1.5 rounded-[8px]',
            ].join(' ')}
          >
            <RefreshCcw size={14} />
            <span className="hidden sm:inline whitespace-nowrap">
              {t('bucket.prefetchCDN')}
            </span>
          </button>
        </SimpleTooltip>
      ) : null}

      <SimpleTooltip content={t('bucket.download')}>
        <button
          type="button"
          onClick={onBatchDownload}
          aria-label={t('bucket.download')}
          className={[
            'flex items-center gap-1.5 shrink-0',
            'text-sm text-[var(--text-secondary)]',
            'hover:text-[var(--text)]',
            'transition-colors px-2 py-1.5 rounded-[8px]',
          ].join(' ')}
        >
          <Download size={14} />
          <span className="hidden sm:inline whitespace-nowrap">
            {t('bucket.download')}
          </span>
        </button>
      </SimpleTooltip>

      {onBatchDelete ? (
        <SimpleTooltip content={t('bucket.delete')}>
          <button
            type="button"
            onClick={onBatchDelete}
            aria-label={t('bucket.delete')}
            className={[
              'flex items-center gap-1.5 shrink-0',
              'text-sm text-[var(--danger)]',
              'hover:text-[var(--danger)]',
              'transition-colors px-2 py-1.5 rounded-[8px]',
            ].join(' ')}
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline whitespace-nowrap">
              {t('bucket.delete')}
            </span>
          </button>
        </SimpleTooltip>
      ) : null}

      {/* 关闭/清除按钮 */}
      <button
        type="button"
        onClick={onClearSelection}
        aria-label={t('bucket.clearSelection')}
        className={[
          'ml-1 shrink-0 p-1.5 rounded-[8px]',
          'text-[var(--text-secondary)]',
          'hover:text-[var(--text)]',
          'hover:bg-[var(--bg-raised)]',
          'transition-all duration-150',
          'active:scale-90',
        ].join(' ')}
      >
        <X size={16} />
      </button>
    </div>
  );
}
