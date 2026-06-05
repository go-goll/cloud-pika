/**
 * VersionHistoryDialog - 文件版本历史对话框
 * 展示对象的历史版本列表，支持下载指定版本
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Download, History, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cloudApi } from '@/lib/api-client';
import { formatFileSize, formatRelativeTime } from '@/lib/format';
import type { ObjectVersion } from '@/types/cloud';

interface VersionHistoryDialogProps {
  open: boolean;
  objectKey: string;
  accountId: string;
  bucket: string;
  onClose: () => void;
  onDownload?: (key: string, versionId: string) => void;
}

export function VersionHistoryDialog({
  open,
  objectKey,
  accountId,
  bucket,
  onClose,
  onDownload,
}: VersionHistoryDialogProps) {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<ObjectVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !accountId || !bucket || !objectKey) return;
    setLoading(true);
    setError('');
    cloudApi
      .listObjectVersions({
        accountId,
        bucket,
        prefix: objectKey,
        limit: 50,
      })
      .then((result) => {
        // 仅保留与当前 key 完全匹配的版本
        const matched = result.versions.filter(
          (v) => v.key === objectKey,
        );
        setVersions(matched);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, accountId, bucket, objectKey]);

  const fileName = objectKey.split('/').pop() ?? objectKey;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className={[
            'fixed left-1/2 top-1/2 z-50 w-[520px] max-h-[70vh]',
            '-translate-x-1/2 -translate-y-1/2',
            'rounded-2xl bg-surface-container-lowest',
            'p-6 ghost-border shadow-ambient',
            'flex flex-col',
          ].join(' ')}
        >
          <Dialog.Title className="flex items-center gap-2 text-base font-semibold text-on-surface">
            <History size={18} />
            {t('bucketSettings.versionHistory')}
          </Dialog.Title>
          <p className="mt-1 text-xs text-on-surface-variant truncate" title={objectKey}>
            {fileName}
          </p>

          {/* 版本列表 */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 min-h-[120px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : error ? (
              <p className="py-4 text-center text-sm text-danger">{error}</p>
            ) : versions.length === 0 ? (
              <EmptyState
                title={t('bucketSettings.noVersions')}
                icon={<History size={32} />}
              />
            ) : (
              versions.map((v) => (
                <div
                  key={v.versionId}
                  className={[
                    'flex items-center gap-3 rounded-xl p-3',
                    'ghost-border transition-colors',
                    'hover:bg-[var(--bg-raised)]',
                  ].join(' ')}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--text-secondary)] truncate max-w-[200px]">
                        {v.versionId}
                      </span>
                      {v.isLatest ? (
                        <Badge variant="success">
                          {t('bucketSettings.latestVersion')}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                      <span>{formatFileSize(v.size)}</span>
                      <span>{formatRelativeTime(v.lastModified)}</span>
                      {v.storageClass ? (
                        <span>{v.storageClass}</span>
                      ) : null}
                    </div>
                  </div>
                  {onDownload ? (
                    <Button
                      variant="ghost"
                      iconOnly
                      className="shrink-0 rounded-lg"
                      onClick={() => onDownload(v.key, v.versionId)}
                    >
                      <Download size={14} />
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {/* 底部关闭 */}
          <div className="mt-4 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="secondary">
                {t('common.close')}
              </Button>
            </Dialog.Close>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
