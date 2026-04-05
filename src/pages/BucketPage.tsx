import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ResourceFilter } from '@/components/resource/ResourceFilter';
import { ResourceGrid } from '@/components/resource/ResourceGrid';
import { ResourceTable } from '@/components/resource/ResourceTable';
import {
  useBucketsQuery,
  useDeleteObjectsMutation,
  useDownloadMutation,
  useGenerateUrlMutation,
  useObjectsQuery,
  useRenameMutation,
  useUploadMutation,
} from '@/hooks/useCloudApi';
import { tauriApi } from '@/lib/tauri';
import { useAccountStore } from '@/stores/useAccountStore';
import { useAppStore } from '@/stores/useAppStore';
import { useBucketStore } from '@/stores/useBucketStore';

export function BucketPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [keyword, setKeyword] = useState('');
  const accounts = useAccountStore((s) => s.accounts);
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const activeAccount = useMemo(
    () => accounts.find((item) => item.id === activeAccountId),
    [accounts, activeAccountId],
  );
  const settings = useAppStore((s) => s.settings);

  const { buckets, activeBucket, objects, syncStatus, setBuckets, setActiveBucket, setObjects } =
    useBucketStore();
  const queueUpload = useUploadMutation().mutateAsync;
  const queueDownload = useDownloadMutation().mutateAsync;
  const deleteObjects = useDeleteObjectsMutation().mutateAsync;
  const renameObject = useRenameMutation().mutateAsync;
  const generateUrl = useGenerateUrlMutation().mutateAsync;

  const bucketsQuery = useBucketsQuery(
    activeAccount?.provider ?? 'qiniu',
    activeAccountId,
    Boolean(activeAccountId && activeAccount),
  );

  const objectsQuery = useObjectsQuery(
    {
      accountId: activeAccountId,
      bucket: activeBucket,
      prefix: keyword,
      limit: 200,
      delimiter: '/',
    },
    Boolean(activeAccountId && activeBucket),
  );
  const refetchBuckets = bucketsQuery.refetch;
  const refetchObjects = objectsQuery.refetch;

  useEffect(() => {
    if (bucketsQuery.data) {
      setBuckets(bucketsQuery.data);
    }
  }, [bucketsQuery.data, setBuckets]);

  useEffect(() => {
    if (objectsQuery.data) {
      setObjects(objectsQuery.data.items, objectsQuery.data.marker);
    }
  }, [objectsQuery.data, setObjects]);

  const uploadLocalFiles = useCallback(async (paths: string[]) => {
    if (!activeAccountId || !activeBucket) {
      return;
    }
    for (const localPath of paths) {
      const key = localPath.split(/[\\/]/).pop() ?? localPath;
      await queueUpload({
        accountId: activeAccountId,
        bucket: activeBucket,
        key,
        localPath,
      });
    }
  }, [activeAccountId, activeBucket, queueUpload]);

  const onClickUpload = useCallback(async () => {
    if (!tauriApi.isTauriEnv()) {
      return;
    }
    const selected = await tauriApi.openFileDialog();
    if (selected.length > 0) {
      await uploadLocalFiles(selected);
    }
  }, [uploadLocalFiles]);

  const onDownload = useCallback(
    async (key: string) => {
      if (!tauriApi.isTauriEnv() || !activeAccountId || !activeBucket) {
        return;
      }
      const selected = await tauriApi.openFolderDialog();
      const folder = selected[0];
      if (!folder) {
        return;
      }
      const fileName = key.split('/').pop() || key;
      const localPath = `${folder}/${fileName}`;
      await queueDownload({
        accountId: activeAccountId,
        bucket: activeBucket,
        key,
        localPath,
      });
    },
    [activeAccountId, activeBucket, queueDownload],
  );

  const onDelete = useCallback(
    async (key: string) => {
      if (!activeAccountId || !activeBucket) {
        return;
      }
      await deleteObjects({
        accountId: activeAccountId,
        bucket: activeBucket,
        keys: [key],
      });
      await refetchObjects();
    },
    [activeAccountId, activeBucket, deleteObjects, refetchObjects],
  );

  const onRename = useCallback(
    async (from: string) => {
      if (!activeAccountId || !activeBucket) {
        return;
      }
      const to = window.prompt('Rename to', from);
      if (!to || to === from) {
        return;
      }
      await renameObject({
        accountId: activeAccountId,
        bucket: activeBucket,
        from,
        to,
      });
      await refetchObjects();
    },
    [activeAccountId, activeBucket, refetchObjects, renameObject],
  );

  const onCopyUrl = useCallback(
    async (key: string) => {
      if (!activeAccountId || !activeBucket) {
        return;
      }
      const result = await generateUrl({
        accountId: activeAccountId,
        bucket: activeBucket,
        key,
        https: settings.https,
      });
      if (tauriApi.isTauriEnv()) {
        await tauriApi.writeClipboardText(result.url);
      } else {
        await navigator.clipboard.writeText(result.url);
      }
    },
    [activeAccountId, activeBucket, generateUrl, settings.https],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop: (files) => {
      const paths = files
        .map((item) => (item as File & { path?: string }).path)
        .filter((value): value is string => Boolean(value));
      if (paths.length > 0) {
        void uploadLocalFiles(paths);
      }
    },
  });

  useEffect(() => {
    if (!tauriApi.isTauriEnv()) {
      return;
    }
    let disposed = false;
    let unlisten: (() => void) | undefined;

    const bind = async () => {
      const { listen } = await import('@tauri-apps/api/event');
      if (disposed) {
        return;
      }
      unlisten = await listen<string[]>('tray-upload-files', (event) => {
        void uploadLocalFiles(event.payload);
      });
    };

    void bind();

    return () => {
      disposed = true;
      if (unlisten) {
        unlisten();
      }
    };
  }, [uploadLocalFiles]);

  useEffect(() => {
    const onRefresh = () => {
      void refetchBuckets();
      void refetchObjects();
    };
    const onUpload = () => {
      void onClickUpload();
    };
    window.addEventListener('cloud-pika:refresh-active', onRefresh);
    window.addEventListener('cloud-pika:upload-active', onUpload);
    return () => {
      window.removeEventListener('cloud-pika:refresh-active', onRefresh);
      window.removeEventListener('cloud-pika:upload-active', onUpload);
    };
  }, [onClickUpload, refetchBuckets, refetchObjects]);

  return (
    <div className="space-y-4" {...getRootProps()}>
      <input {...getInputProps()} />
      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <Card className="bg-[var(--surface-low)]">
          <h3 className="font-display text-lg font-semibold">{t('bucket.title')}</h3>
          <div className="mt-3 space-y-2">
            {buckets.map((bucket) => (
              <button
                key={bucket.name}
                type="button"
                onClick={() => setActiveBucket(bucket.name)}
                className={[
                  'flex w-full items-center justify-between rounded-[var(--radius)] px-3 py-2 text-left',
                  activeBucket === bucket.name
                    ? 'bg-[var(--surface-elevated)]'
                    : 'hover:bg-[var(--surface-elevated)]/70',
                ].join(' ')}
              >
                <span className="text-sm font-medium">{bucket.name}</span>
                <span className="text-xs text-[var(--text-muted)]">{bucket.location ?? '-'}</span>
              </button>
            ))}
          </div>
        </Card>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ResourceFilter keyword={keyword} onKeywordChange={setKeyword} />
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => void onClickUpload()}>
                <UploadCloud size={16} className="mr-2" />
                {t('bucket.upload')}
              </Button>
              <Button variant={view === 'table' ? 'primary' : 'secondary'} onClick={() => setView('table')}>
                {t('bucket.table')}
              </Button>
              <Button variant={view === 'grid' ? 'primary' : 'secondary'} onClick={() => setView('grid')}>
                {t('bucket.grid')}
              </Button>
            </div>
          </div>

          {view === 'table' ? (
            <ResourceTable
              objects={objects}
              onCopyUrl={onCopyUrl}
              onDelete={onDelete}
              onDownload={onDownload}
              onRename={onRename}
            />
          ) : (
            <ResourceGrid
              objects={objects}
              onCopyUrl={onCopyUrl}
              onDelete={onDelete}
              onDownload={onDownload}
              onRename={onRename}
            />
          )}

          {bucketsQuery.isLoading || objectsQuery.isLoading ? (
            <p className="text-sm text-[var(--text-muted)]">{t('common.loading')}</p>
          ) : null}
          {syncStatus === 'syncing' ? (
            <p className="text-xs text-[var(--text-muted)]">{t('bucket.syncing')}</p>
          ) : null}
          {isDragActive ? (
            <Card className="border border-[var(--primary)] bg-[color-mix(in_srgb,var(--surface-high)_90%,transparent)] p-5 text-sm">
              {t('bucket.dropHint')}
            </Card>
          ) : null}
        </section>
      </div>
    </div>
  );
}
