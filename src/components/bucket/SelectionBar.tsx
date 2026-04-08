/**
 * SelectionBar - 批量操作浮动栏组件
 * 当有文件被选中时从底部滑入，显示选中数量和批量操作按钮
 * 窄窗口下按钮只显示图标
 */
import { useTranslation } from 'react-i18next';
import { Copy, Download, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SimpleTooltip } from '@/components/ui/Tooltip';

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
        'flex items-center gap-2 sm:gap-3',
        'rounded-[calc(var(--radius)+4px)]',
        'bg-[var(--surface-high)] px-3 py-2.5 sm:px-5 sm:py-3',
        'shadow-[0_8px_40px_rgba(0,0,0,0.15)]',
        'border border-[var(--outline)]',
        'animate-[slideUp_0.2s_ease-out]',
      ].join(' ')}
    >
      {/* 选中数量 */}
      <span className="whitespace-nowrap text-sm font-medium">
        {t('bucket.selectedCount', { count })}
      </span>

      {/* 分隔线 */}
      <div className="h-5 w-px bg-outline-variant" />

      {/* 批量操作（窄窗口隐藏文字） */}
      <SimpleTooltip content={t('bucket.copyUrl')}>
        <Button
          variant="ghost"
          onClick={onBatchCopyUrl}
          className="gap-1.5"
        >
          <Copy size={14} />
          <span className="hidden sm:inline">
            {t('bucket.copyUrl')}
          </span>
        </Button>
      </SimpleTooltip>

      <SimpleTooltip content={t('bucket.download')}>
        <Button
          variant="ghost"
          onClick={onBatchDownload}
          className="gap-1.5"
        >
          <Download size={14} />
          <span className="hidden sm:inline">
            {t('bucket.download')}
          </span>
        </Button>
      </SimpleTooltip>

      <SimpleTooltip content={t('bucket.delete')}>
        <Button
          variant="ghost"
          onClick={onBatchDelete}
          className="gap-1.5 text-[var(--danger)]"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">
            {t('bucket.delete')}
          </span>
        </Button>
      </SimpleTooltip>

      {/* 分隔线 */}
      <div className="h-5 w-px bg-outline-variant" />

      {/* 取消选择 */}
      <button
        type="button"
        onClick={onClearSelection}
        className="text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
