/**
 * FetchUrlDialog - 远程抓取对话框
 * 输入远程文件 URL，自动生成目标 key，提交抓取任务
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface FetchUrlDialogProps {
  open: boolean;
  /** 当前目录前缀，拼接到目标 key 前 */
  prefix: string;
  onClose: () => void;
  onSubmit: (sourceUrl: string, key: string) => Promise<void>;
}

/** 从 URL 路径中提取文件名 */
function extractFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? '';
  } catch {
    return '';
  }
}

export function FetchUrlDialog({
  open,
  prefix,
  onClose,
  onSubmit,
}: FetchUrlDialogProps) {
  const { t } = useTranslation();

  const [sourceUrl, setSourceUrl] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 打开时重置状态
  useEffect(() => {
    if (open) {
      setSourceUrl('');
      setKey('');
      setLoading(false);
      setError('');
    }
  }, [open]);

  // URL 变化时自动提取文件名并拼接 prefix
  const handleUrlChange = useCallback(
    (url: string) => {
      setSourceUrl(url);
      setError('');
      const filename = extractFilenameFromUrl(url);
      if (filename) {
        setKey(prefix + decodeURIComponent(filename));
      }
    },
    [prefix],
  );

  const handleSubmit = useCallback(async () => {
    if (!sourceUrl.trim() || !key.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(sourceUrl.trim(), key.trim());
    } catch (err) {
      setError(
        (err as Error).message || t('toast.operationFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, [sourceUrl, key, onSubmit, t]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('bucket.fetchUrl')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 远程 URL 输入 */}
          <div className="space-y-1.5">
            <Input
              value={sourceUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={t('bucket.fetchUrlPlaceholder')}
              autoFocus
            />
          </div>

          {/* 目标路径输入 */}
          <div className="space-y-1.5">
            <label className="text-xs text-on-surface-variant">
              {t('bucket.destinationKey')}
            </label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>

          {/* 错误提示 */}
          {error ? (
            <p className="text-sm text-danger">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={loading || !sourceUrl.trim() || !key.trim()}
          >
            {loading
              ? t('common.loading')
              : t('bucket.fetchSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
