/**
 * SelectionBar - 批量操作浮动栏组件
 * 当有文件被选中时从底部滑入，显示选中数量和批量操作按钮
 */
import { useTranslation } from 'react-i18next';
import { Copy, Download, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SelectionBarProps {
  count: number;
  onBatchDownload: () => void;
  onBatchCopyUrl: () => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
}

export function SelectionBar({
  count,
  onBatchDownload,
  onBatchCopyUrl,
  onBatchDelete,
  onClearSelection,
}: SelectionBarProps) {
  const { t } = useTranslation();

  if (count === 0) return null;

  return (
    <div
      className={[
        'fixed bottom-4 left-1/2 z-40',
        '-translate-x-1/2',
        'flex items-center gap-3',
        'rounded-[calc(var(--radius)+4px)]',
        'bg-[var(--surface-high)] px-5 py-3',
        'shadow-[0_8px_40px_rgba(0,0,0,0.15)]',
        'border border-[var(--outline)]',
        'animate-[slideUp_0.2s_ease-out]',
      ].join(' ')}
    >
      {/* 选中数量 */}
      <span className="text-sm font-medium">
        {t('bucket.selectedCount', { count })}
      </span>

      {/* 分隔线 */}
      <div className="h-5 w-px bg-[var(--outline)]" />

      {/* 批量操作 */}
      <Button
        variant="ghost"
        onClick={onBatchCopyUrl}
        className="gap-1.5"
      >
        <Copy size={14} />
        {t('bucket.copyUrl')}
      </Button>

      <Button
        variant="ghost"
        onClick={onBatchDownload}
        className="gap-1.5"
      >
        <Download size={14} />
        {t('bucket.download')}
      </Button>

      <Button
        variant="ghost"
        onClick={onBatchDelete}
        className="gap-1.5 text-[var(--danger)]"
      >
        <Trash2 size={14} />
        {t('bucket.delete')}
      </Button>

      {/* 分隔线 */}
      <div className="h-5 w-px bg-[var(--outline)]" />

      {/* 取消选择 */}
      <button
        type="button"
        onClick={onClearSelection}
        className={
          'text-[var(--text-muted)] '
          + 'hover:text-[var(--text)] transition-colors'
        }
      >
        <X size={16} />
      </button>
    </div>
  );
}
