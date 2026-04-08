/**
 * UrlDialog - URL生成和复制对话框组件
 * 显示生成的URL，支持一键复制和HTTPS切换
 */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, Copy, Link } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { tauriApi } from '@/lib/tauri';

interface UrlDialogProps {
  open: boolean;
  url: string;
  onClose: () => void;
}

export function UrlDialog({
  open,
  url,
  onClose,
}: UrlDialogProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      if (tauriApi.isTauriEnv()) {
        await tauriApi.writeClipboardText(url);
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败静默处理
    }
  }, [url]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setCopied(false);
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className={[
            'fixed left-1/2 top-1/2 z-50 w-[480px]',
            '-translate-x-1/2 -translate-y-1/2',
            'rounded-xl bg-surface-container-lowest',
            'p-6 ghost-border shadow-ambient',
          ].join(' ')}
        >
          <Dialog.Title className="flex items-center gap-2 text-base font-semibold text-on-surface">
            <Link size={16} className="text-primary" />
            {t('bucket.copyUrl')}
          </Dialog.Title>

          {/* URL显示 */}
          <div className="mt-4 flex gap-2">
            <Input
              value={url}
              readOnly
              className="flex-1 font-mono text-xs"
            />
            <Button
              variant={
                copied ? 'secondary' : 'primary'
              }
              onClick={() => void handleCopy()}
            >
              {copied ? (
                <Check size={15} />
              ) : (
                <Copy size={15} />
              )}
            </Button>
          </div>

          {/* 关闭 */}
          <div className="mt-5 flex justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              {t('common.close')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
