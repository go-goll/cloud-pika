/**
 * DeleteConfirmDialog - 删除确认对话框组件
 * 显示待删除文件名或批量数量，确认按钮为红色危险样式
 */
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeleteConfirmDialogProps {
  open: boolean;
  /** 待删除的文件key列表 */
  keys: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

/** 从对象 key 提取展示用文件名，保留目录的尾部斜杠。 */
function displayName(key: string): string {
  const isDir = key.endsWith('/');
  const trimmed = isDir ? key.slice(0, -1) : key;
  const base = trimmed.split('/').pop() ?? trimmed;
  return isDir ? `${base}/` : base;
}

/** 批量删除时最多逐项列出的文件数，超出仅显示总数。 */
const MAX_LISTED = 5;

export function DeleteConfirmDialog({
  open,
  keys,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  const isBatch = keys.length > 1;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => !v && onCancel()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(13,17,21,0.4)]" />
        <Dialog.Content
          className={[
            'fixed left-1/2 top-1/2 z-50 w-[420px]',
            '-translate-x-1/2 -translate-y-1/2',
            'rounded-[8px] bg-surface-container-lowest',
            'p-6 ghost-border shadow-ambient',
          ].join(' ')}
        >
          {/* 标题 */}
          <Dialog.Title className="flex items-center gap-2 text-base font-semibold text-on-surface">
            <AlertTriangle
              size={18}
              className="text-danger"
            />
            {t('bucket.confirmDelete')}
          </Dialog.Title>

          {/* 警告说明 */}
          <div className="mt-3 text-sm text-on-surface-variant">
            <p>{t('bucket.deleteWarning')}</p>
            {isBatch ? (
              <>
                <p className="mt-2 font-medium text-on-surface">
                  {t('bucket.deleteCount', { count: keys.length })}
                </p>
                {keys.length <= MAX_LISTED ? (
                  <ul className="mt-2 space-y-1">
                    {keys.map((key) => (
                      <li
                        key={key}
                        title={key}
                        className="truncate font-mono text-xs text-on-surface-variant"
                      >
                        {displayName(key)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p
                className="mt-2 truncate font-mono text-xs text-on-surface"
                title={keys[0]}
              >
                {displayName(keys[0] ?? '')}
              </p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onCancel}
              autoFocus
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
            >
              {t('bucket.delete')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
