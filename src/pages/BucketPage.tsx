/**
 * BucketPage - 资源浏览器主页面（容器组件）
 * 负责组织布局、管理选中状态、协调子组件间通信
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
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
import { BucketSidebar } from '@/components/bucket/BucketSidebar';
import { BucketToolbar } from '@/components/bucket/BucketToolbar';
import type { ViewMode } from '@/components/bucket/BucketToolbar';
import { BreadcrumbNav } from '@/components/bucket/BreadcrumbNav';
import { SelectionBar } from '@/components/bucket/SelectionBar';
import { RenameDialog } from '@/components/bucket/RenameDialog';
import { DeleteConfirmDialog } from '@/components/bucket/DeleteConfirmDialog';
import { UploadZone } from '@/components/bucket/UploadZone';
import { UrlDialog } from '@/components/bucket/UrlDialog';
import { ResourceTable } from '@/components/resource/ResourceTable';
import { ResourceGrid } from '@/components/resource/ResourceGrid';
import { ImagePreview } from '@/components/preview/ImagePreview';
import { isImageKey, extractFileName } from '@/lib/format';

export function BucketPage() {
  const { t } = useTranslation();

  // ---- 视图状态 ----
  const [view, setView] = useState<ViewMode>('table');
  const [prefix, setPrefix] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // ---- 选中状态 ----
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    new Set(),
  );
  const lastClickedKeyRef = useRef<string | null>(null);

  // ---- 对话框状态 ----
  const [renameTarget, setRenameTarget] = useState('');
  const [deleteTargets, setDeleteTargets] = useState<string[]>([]);
  const [urlDialogUrl, setUrlDialogUrl] = useState('');

  // ---- 图片预览状态 ----
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');

  // ---- 全局Store ----
  const accounts = useAccountStore((s) => s.accounts);
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId),
    [accounts, activeAccountId],
  );
  const settings = useAppStore((s) => s.settings);

  const {
    buckets,
    activeBucket,
    objects,
    syncStatus,
    setBuckets,
    setActiveBucket,
    setObjects,
    reset,
  } = useBucketStore();

  const prevAccountIdRef = useRef('');

  // ---- API Mutations ----
  const queueUpload = useUploadMutation().mutateAsync;
  const queueDownload = useDownloadMutation().mutateAsync;
  const deleteObjects = useDeleteObjectsMutation().mutateAsync;
  const renameObject = useRenameMutation().mutateAsync;
  const generateUrl = useGenerateUrlMutation().mutateAsync;

  // ---- 查询 ----
  const bucketsQuery = useBucketsQuery(
    activeAccount?.provider ?? 'qiniu',
    activeAccountId,
    Boolean(activeAccountId && activeAccount),
  );

  // 搜索时将keyword作为prefix，否则使用目录prefix
  const effectivePrefix = searchKeyword || prefix;

  const objectsQuery = useObjectsQuery(
    {
      accountId: activeAccountId,
      bucket: activeBucket,
      prefix: effectivePrefix,
      limit: 200,
      delimiter: '/',
    },
    Boolean(activeAccountId && activeBucket),
  );

  const refetchBuckets = bucketsQuery.refetch;
  const refetchObjects = objectsQuery.refetch;

  // ---- 数据同步 ----
  useEffect(() => {
    if (bucketsQuery.data) setBuckets(bucketsQuery.data);
  }, [bucketsQuery.data, setBuckets]);

  useEffect(() => {
    if (objectsQuery.data) {
      setObjects(
        objectsQuery.data.items,
        objectsQuery.data.marker,
      );
    }
  }, [objectsQuery.data, setObjects]);

  // 账户切换时重置
  useEffect(() => {
    if (prevAccountIdRef.current !== activeAccountId) {
      reset();
      setPrefix('');
      setSearchKeyword('');
      setSelectedKeys(new Set());
      prevAccountIdRef.current = activeAccountId;
    }
  }, [activeAccountId, reset]);

  // prefix改变时清空选中
  useEffect(() => {
    setSelectedKeys(new Set());
  }, [prefix, searchKeyword]);

  // ---- 选中逻辑 ----
  /** 切换单个文件选中（支持Shift范围选择） */
  const handleSelect = useCallback(
    (key: string, shiftKey: boolean) => {
      setSelectedKeys((prev) => {
        const next = new Set(prev);

        if (shiftKey && lastClickedKeyRef.current) {
          // Shift+点击范围选择
          const keys = objects.map((o) => o.key);
          const startIdx = keys.indexOf(
            lastClickedKeyRef.current,
          );
          const endIdx = keys.indexOf(key);
          if (startIdx >= 0 && endIdx >= 0) {
            const [from, to] =
              startIdx < endIdx
                ? [startIdx, endIdx]
                : [endIdx, startIdx];
            for (let i = from; i <= to; i++) {
              next.add(keys[i]);
            }
          }
        } else if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }

        lastClickedKeyRef.current = key;
        return next;
      });
    },
    [objects],
  );

  /** 全选/取消全选 */
  const handleSelectAll = useCallback(() => {
    setSelectedKeys((prev) => {
      const allSelected = objects.every(
        (o) => prev.has(o.key),
      );
      if (allSelected) return new Set();
      return new Set(objects.map((o) => o.key));
    });
  }, [objects]);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  // ---- 文件操作 ----
  const uploadLocalFiles = useCallback(
    async (paths: string[]) => {
      if (!activeAccountId || !activeBucket) return;
      for (const localPath of paths) {
        const key =
          prefix
          + (localPath.split(/[\\/]/).pop() ?? localPath);
        await queueUpload({
          accountId: activeAccountId,
          bucket: activeBucket,
          key,
          localPath,
        });
      }
    },
    [activeAccountId, activeBucket, prefix, queueUpload],
  );

  const onClickUpload = useCallback(async () => {
    if (!tauriApi.isTauriEnv()) return;
    const selected = await tauriApi.openFileDialog();
    if (selected.length > 0) {
      await uploadLocalFiles(selected);
    }
  }, [uploadLocalFiles]);

  const onDownload = useCallback(
    async (key: string) => {
      if (
        !tauriApi.isTauriEnv()
        || !activeAccountId
        || !activeBucket
      ) {
        return;
      }
      const selected = await tauriApi.openFolderDialog();
      const folder = selected[0];
      if (!folder) return;
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

  /** 触发删除确认（单个或批量） */
  const onRequestDelete = useCallback((key: string) => {
    setDeleteTargets([key]);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!activeAccountId || !activeBucket) return;
    await deleteObjects({
      accountId: activeAccountId,
      bucket: activeBucket,
      keys: deleteTargets,
    });
    setDeleteTargets([]);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      deleteTargets.forEach((k) => next.delete(k));
      return next;
    });
    await refetchObjects();
  }, [
    activeAccountId,
    activeBucket,
    deleteObjects,
    deleteTargets,
    refetchObjects,
  ]);

  /** 触发重命名对话框 */
  const onRequestRename = useCallback((key: string) => {
    setRenameTarget(key);
  }, []);

  const onConfirmRename = useCallback(
    async (newName: string) => {
      if (!activeAccountId || !activeBucket) return;
      // 保持相同目录路径
      const dir = renameTarget.includes('/')
        ? renameTarget.substring(
            0,
            renameTarget.lastIndexOf('/') + 1,
          )
        : '';
      await renameObject({
        accountId: activeAccountId,
        bucket: activeBucket,
        from: renameTarget,
        to: dir + newName,
      });
      setRenameTarget('');
      await refetchObjects();
    },
    [
      activeAccountId,
      activeBucket,
      renameObject,
      renameTarget,
      refetchObjects,
    ],
  );

  const onCopyUrl = useCallback(
    async (key: string) => {
      if (!activeAccountId || !activeBucket) return;
      const result = await generateUrl({
        accountId: activeAccountId,
        bucket: activeBucket,
        key,
        https: settings.https,
      });
      setUrlDialogUrl(result.url);
    },
    [activeAccountId, activeBucket, generateUrl, settings.https],
  );

  /** 预览图片：生成签名URL并打开预览 */
  const onPreview = useCallback(
    async (key: string) => {
      if (!activeAccountId || !activeBucket) return;
      // 判断是否为图片文件
      const obj = objects.find((o) => o.key === key);
      const isImage =
        isImageKey(key)
        || obj?.mimeType?.startsWith('image/');
      if (!isImage) return;

      const result = await generateUrl({
        accountId: activeAccountId,
        bucket: activeBucket,
        key,
        https: settings.https,
      });
      setPreviewUrl(result.url);
      setPreviewFileName(extractFileName(key));
    },
    [
      activeAccountId,
      activeBucket,
      generateUrl,
      objects,
      settings.https,
    ],
  );

  // ---- 批量操作 ----
  const handleBatchDelete = useCallback(() => {
    setDeleteTargets(Array.from(selectedKeys));
  }, [selectedKeys]);

  const handleBatchDownload = useCallback(async () => {
    for (const key of selectedKeys) {
      await onDownload(key);
    }
  }, [selectedKeys, onDownload]);

  const handleBatchCopyUrl = useCallback(async () => {
    // 批量复制：逐个生成并拼接
    if (!activeAccountId || !activeBucket) return;
    const urls: string[] = [];
    for (const key of selectedKeys) {
      const result = await generateUrl({
        accountId: activeAccountId,
        bucket: activeBucket,
        key,
        https: settings.https,
      });
      urls.push(result.url);
    }
    const text = urls.join('\n');
    if (tauriApi.isTauriEnv()) {
      await tauriApi.writeClipboardText(text);
    } else {
      await navigator.clipboard.writeText(text);
    }
  }, [
    activeAccountId,
    activeBucket,
    generateUrl,
    selectedKeys,
    settings.https,
  ]);

  // ---- 文件夹导航 ----
  const navigateToFolder = useCallback((newPrefix: string) => {
    setPrefix(newPrefix);
    setSearchKeyword('');
  }, []);

  // ---- 刷新 ----
  const handleRefresh = useCallback(() => {
    void refetchBuckets();
    void refetchObjects();
  }, [refetchBuckets, refetchObjects]);

  // ---- Bucket切换 ----
  const handleBucketSelect = useCallback(
    (name: string) => {
      setActiveBucket(name);
      setPrefix('');
      setSearchKeyword('');
      setSelectedKeys(new Set());
    },
    [setActiveBucket],
  );

  // ---- 拖拽上传 ----
  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({
      noClick: true,
      noKeyboard: true,
      onDrop: (files) => {
        const paths = files
          .map(
            (f) => (f as File & { path?: string }).path,
          )
          .filter((v): v is string => Boolean(v));
        if (paths.length > 0) void uploadLocalFiles(paths);
      },
    });

  // ---- Tauri事件监听 ----
  useEffect(() => {
    if (!tauriApi.isTauriEnv()) return;
    let disposed = false;
    let unlisten: (() => void) | undefined;

    const bind = async () => {
      const { listen } = await import(
        '@tauri-apps/api/event'
      );
      if (disposed) return;
      unlisten = await listen<string[]>(
        'tray-upload-files',
        (event) => void uploadLocalFiles(event.payload),
      );
    };
    void bind();

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [uploadLocalFiles]);

  // ---- 全局事件监听 ----
  useEffect(() => {
    const onRefresh = () => handleRefresh();
    const onUpload = () => void onClickUpload();
    window.addEventListener(
      'cloud-pika:refresh-active',
      onRefresh,
    );
    window.addEventListener(
      'cloud-pika:upload-active',
      onUpload,
    );
    return () => {
      window.removeEventListener(
        'cloud-pika:refresh-active',
        onRefresh,
      );
      window.removeEventListener(
        'cloud-pika:upload-active',
        onUpload,
      );
    };
  }, [handleRefresh, onClickUpload]);

  // ---- 提取重命名目标的文件名（不含目录路径） ----
  const renameFileName = useMemo(() => {
    if (!renameTarget) return '';
    const parts = renameTarget.split('/');
    return parts[parts.length - 1] || renameTarget;
  }, [renameTarget]);

  // ---- 渲染 ----
  return (
    <div className="space-y-4" {...getRootProps()}>
      <input {...getInputProps()} />

      <div
        className={
          'grid gap-4 '
          + 'lg:grid-cols-[200px_1fr] '
          + 'xl:grid-cols-[240px_1fr]'
        }
      >
        {/* 左侧：Bucket列表 */}
        <BucketSidebar
          buckets={buckets}
          activeBucket={activeBucket}
          isLoading={bucketsQuery.isLoading}
          onSelect={handleBucketSelect}
        />

        {/* 右侧：资源浏览区 */}
        <section className="space-y-3">
          {/* 面包屑导航 */}
          {activeBucket ? (
            <BreadcrumbNav
              bucket={activeBucket}
              prefix={prefix}
              onNavigate={navigateToFolder}
            />
          ) : null}

          {/* 工具栏 */}
          <BucketToolbar
            view={view}
            selectedCount={selectedKeys.size}
            onViewChange={setView}
            onSearch={setSearchKeyword}
            onUpload={() => void onClickUpload()}
            onRefresh={handleRefresh}
          />

          {/* 资源列表 */}
          {view === 'table' ? (
            <ResourceTable
              objects={objects}
              selectedKeys={selectedKeys}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onCopyUrl={(k) => void onCopyUrl(k)}
              onDelete={onRequestDelete}
              onDownload={(k) => void onDownload(k)}
              onRename={onRequestRename}
              onPreview={(k) => void onPreview(k)}
              onNavigateFolder={navigateToFolder}
              onUpload={() => void onClickUpload()}
              onRefresh={handleRefresh}
            />
          ) : (
            <ResourceGrid
              objects={objects}
              selectedKeys={selectedKeys}
              accountId={activeAccountId}
              bucket={activeBucket}
              onSelect={handleSelect}
              onCopyUrl={(k) => void onCopyUrl(k)}
              onDelete={onRequestDelete}
              onDownload={(k) => void onDownload(k)}
              onRename={onRequestRename}
              onPreview={(k) => void onPreview(k)}
              onNavigateFolder={navigateToFolder}
              onUpload={() => void onClickUpload()}
              onRefresh={handleRefresh}
            />
          )}

          {/* 加载/错误/同步状态 */}
          {bucketsQuery.isLoading || objectsQuery.isLoading ? (
            <p className="text-sm text-on-surface-variant">
              {t('common.loading')}
            </p>
          ) : null}

          {bucketsQuery.error ? (
            <p className="text-sm text-danger">
              {(bucketsQuery.error as Error).message}
            </p>
          ) : null}

          {objectsQuery.error ? (
            <p className="text-sm text-danger">
              {(objectsQuery.error as Error).message}
            </p>
          ) : null}

          {syncStatus === 'syncing' ? (
            <p className="text-xs text-on-surface-variant">
              {t('bucket.syncing')}
            </p>
          ) : null}
        </section>
      </div>

      {/* 拖拽上传遮罩 */}
      <UploadZone isDragActive={isDragActive} />

      {/* 批量操作浮动栏 */}
      <SelectionBar
        count={selectedKeys.size}
        onBatchDownload={() => void handleBatchDownload()}
        onBatchCopyUrl={() => void handleBatchCopyUrl()}
        onBatchDelete={handleBatchDelete}
        onClearSelection={clearSelection}
      />

      {/* 重命名对话框 */}
      <RenameDialog
        open={renameTarget !== ''}
        currentName={renameFileName}
        onConfirm={(name) => void onConfirmRename(name)}
        onCancel={() => setRenameTarget('')}
      />

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteTargets.length > 0}
        keys={deleteTargets}
        onConfirm={() => void onConfirmDelete()}
        onCancel={() => setDeleteTargets([])}
      />

      {/* URL对话框 */}
      <UrlDialog
        open={urlDialogUrl !== ''}
        url={urlDialogUrl}
        onClose={() => setUrlDialogUrl('')}
      />

      {/* 图片预览 */}
      <ImagePreview
        open={previewUrl !== ''}
        imageUrl={previewUrl}
        fileName={previewFileName}
        onClose={() => {
          setPreviewUrl('');
          setPreviewFileName('');
        }}
      />
    </div>
  );
}
