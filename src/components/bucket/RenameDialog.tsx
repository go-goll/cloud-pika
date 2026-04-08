/**
 * RenameDialog - 重命名对话框组件
 * 替代 window.prompt()，支持自动选中文件名部分
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface RenameDialogProps {
  open: boolean;
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

/**
 * 计算文件名中需要选中的范围
 * 选中文件名部分，不包含扩展名
 */
function getSelectionRange(
  name: string,
): [number, number] {
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex > 0) return [0, dotIndex];
  return [0, name.length];
}

export function RenameDialog({
  open,
  currentName,
  onConfirm,
  onCancel,
}: RenameDialogProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  // 对话框打开时重置并自动选中
  useEffect(() => {
    if (open) {
      setValue(currentName);
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        const [start, end] =
          getSelectionRange(currentName);
        el.setSelectionRange(start, end);
      });
    }
  }, [open, currentName]);

  const handleConfirm = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== currentName) {
      onConfirm(trimmed);
    } else {
      onCancel();
    }
  }, [value, currentName, onConfirm, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleConfirm();
      if (e.key === 'Escape') onCancel();
    },
    [handleConfirm, onCancel],
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => !v && onCancel()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className={[
            'fixed left-1/2 top-1/2 z-50 w-[400px]',
            '-translate-x-1/2 -translate-y-1/2',
            'rounded-xl bg-surface-container-lowest',
            'p-6 ghost-border shadow-ambient',
          ].join(' ')}
        >
          <Dialog.Title className="text-base font-semibold text-on-surface">
            {t('bucket.rename')}
          </Dialog.Title>

          <div className="mt-4">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onCancel}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                !value.trim() ||
                value.trim() === currentName
              }
            >
              {t('common.confirm')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
