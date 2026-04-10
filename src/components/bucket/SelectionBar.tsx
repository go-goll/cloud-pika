/**
 * SelectionBar - 批量操作浮动栏组件
 * 当有文件被选中时从底部滑入，毛玻璃效果
 */
import { useTranslation } from 'react-i18next';
import {
  Copy,
  Download,
  RefreshCcw,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SimpleTooltip } from '@/components/ui/Tooltip';

interface SelectionBarProps {
  count: number;
  onBatchDownload: () => void;
  onBatchCopyUrl: () => void;
  onBatchRefreshCDN?: () => void;
  onBatchDelete?: () => void;
  onClearSelection: () => void;
}

export function SelectionBar({
  count,
  onBatchDownload,
  onBatchCopyUrl,
  onBatchRefreshCDN,
  onBatchDelete,
  onClearSelection,
}: SelectionBarProps) {
  const { t } = useTranslation();

  if (count === 0) return null;

  return (
    <div
      className={[
        'fixed bottom-5 left-1/2 z-40',
        '-translate-x-1/2',
        'flex items-center gap-2 sm:gap-3',
        'rounded-xl',
        'glass-panel',
        'px-4 py-2.5 sm:px-5 sm:py-3',
        'shadow-[var(--shadow-xl)]',
        'border border-[var(--border)]',
        'animate-[slideUp_0.25s_ease-out]',
      ].join(' ')}
    >
      {/* 选中数量 */}
      <span
        className={[
          'whitespace-nowrap text-sm font-semibold',
          'text-[var(--accent)]',
        ].join(' ')}
      >
        {t('bucket.selectedCount', { count })}
      </span>

      {/* 分隔线 */}
      <div className="h-5 w-px bg-[var(--border)]" />

      {/* 批量操作 */}
      <SimpleTooltip content={t('bucket.copyUrl')}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBatchCopyUrl}
          className="gap-1.5"
        >
          <Copy size={14} />
          <span className="hidden sm:inline">
            {t('bucket.copyUrl')}
          </span>
        </Button>
      </SimpleTooltip>

      {onBatchRefreshCDN ? (
        <SimpleTooltip content={t('bucket.refreshCDN')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBatchRefreshCDN}
            className="gap-1.5"
          >
            <RefreshCcw size={14} />
            <span className="hidden sm:inline">
              {t('bucket.refreshCDN')}
            </span>
          </Button>
        </SimpleTooltip>
      ) : null}

      <SimpleTooltip content={t('bucket.download')}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBatchDownload}
          className="gap-1.5"
        >
          <Download size={14} />
          <span className="hidden sm:inline">
            {t('bucket.download')}
          </span>
        </Button>
      </SimpleTooltip>

      {onBatchDelete ? (
        <SimpleTooltip content={t('bucket.delete')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBatchDelete}
            className="gap-1.5 text-[var(--danger)]"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">
              {t('bucket.delete')}
            </span>
          </Button>
        </SimpleTooltip>
      ) : null}

      {/* 分隔线 */}
      <div className="h-5 w-px bg-[var(--border)]" />

      {/* 取消选择 */}
      <button
        type="button"
        onClick={onClearSelection}
        className={[
          'text-[var(--text-secondary)]',
          'hover:text-[var(--text)]',
          'transition-all duration-150',
          'hover:bg-[var(--bg-raised)]',
          'rounded-md p-1',
          'active:scale-90',
        ].join(' ')}
      >
        <X size={16} />
      </button>
    </div>
  );
}
