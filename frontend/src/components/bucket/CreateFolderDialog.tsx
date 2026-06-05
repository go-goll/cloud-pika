/**
 * CreateFolderDialog - 新建文件夹对话框
 * 输入文件夹名称后在当前 prefix 下创建空对象
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

interface CreateFolderDialogProps {
  open: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function CreateFolderDialog({
  open,
  onConfirm,
  onCancel,
}: CreateFolderDialogProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleConfirm = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) onConfirm(trimmed);
  }, [value, onConfirm]);

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
            {t('bucket.newFolder')}
          </Dialog.Title>

          <div className="mt-4">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('bucket.folderNamePlaceholder')}
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!value.trim()}
            >
              {t('common.confirm')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
