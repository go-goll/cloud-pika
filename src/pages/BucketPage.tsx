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
  useCreateFolderMutation,
  useDeleteObjectsMutation,
  useDomainsQuery,
  useDownloadMutation,
  useFetchMutation,
  useGenerateUrlMutation,
  useObjectsQuery,
  usePrefetchCDNMutation,
  useProviderFeaturesQuery,
  useRefreshCDNMutation,
  useRenameMutation,
  useUploadMutation,
} from '@/hooks/useCloudApi';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { tauriApi } from '@/lib/tauri';
import { cloudApi } from '@/lib/api-client';
import { useAccountStore } from '@/stores/useAccountStore';
import { useAppStore } from '@/stores/useAppStore';
import { useBucketStore } from '@/stores/useBucketStore';
import { BucketToolbar } from '@/components/bucket/BucketToolbar';
import { BucketSettingsDrawer } from '@/components/bucket/BucketSettingsDrawer';
import type { ViewMode } from '@/components/bucket/BucketToolbar';
import { BreadcrumbNav } from '@/components/bucket/BreadcrumbNav';
import { SelectionBar } from '@/components/bucket/SelectionBar';
import { RenameDialog } from '@/components/bucket/RenameDialog';
import { DeleteConfirmDialog } from '@/components/bucket/DeleteConfirmDialog';
import { UploadZone } from '@/components/bucket/UploadZone';
import { VersionHistoryDialog } from '@/components/bucket/VersionHistoryDialog';
import { CreateFolderDialog } from '@/components/bucket/CreateFolderDialog';
import { FetchUrlDialog } from '@/components/bucket/FetchUrlDialog';
import { UrlDialog } from '@/components/bucket/UrlDialog';
import { ResourceTable } from '@/components/resource/ResourceTable';
import { ResourceGrid } from '@/components/resource/ResourceGrid';
import { FilePreview } from '@/components/preview/FilePreview';
import { getPreviewType } from '@/lib/preview-type';
import {
  isImageKey,
  extractFileName,
  formatCopyUrl,
} from '@/lib/format';
import { toast } from '@/lib/toast';

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
  const [urlDialogKey, setUrlDialogKey] = useState('');
  const [fetchDialogOpen, setFetchDialogOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [versionHistoryKey, setVersionHistoryKey] = useState('');
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

  // ---- 图片预览状态 ----
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewKey, setPreviewKey] = useState('');

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
    domainPrefs,
    setBuckets,
    setActiveBucket,
    setObjects,
    appendObjects,
    setDomainPref,
    reset,
  } = useBucketStore();

  const prevAccountIdRef = useRef('');

  // ---- API Mutations ----
  const queueUpload = useUploadMutation().mutateAsync;
  const queueDownload = useDownloadMutation().mutateAsync;
  const deleteObjects = useDeleteObjectsMutation().mutateAsync;
  const renameObject = useRenameMutation().mutateAsync;
  const createFolder = useCreateFolderMutation().mutateAsync;
  const fetchMutation = useFetchMutation();
  const generateUrl = useGenerateUrlMutation().mutateAsync;
  const refreshCDN = useRefreshCDNMutation();
  const prefetchCDN = usePrefetchCDNMutation();

  // ---- 查询 ----
  const bucketsQuery = useBucketsQuery(
    activeAccount?.provider ?? 'qiniu',
    activeAccountId,
    Boolean(activeAccountId && activeAccount),
  );

  // 搜索时将keyword作为prefix，否则使用目录prefix
  const effectivePrefix = searchKeyword || prefix;
  const pageLimit = settings.paging ? 50 : 200;

  // 加载更多用的分页 marker
  const [pageMarker, setPageMarker] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const objectsQuery = useObjectsQuery(
    {
      accountId: activeAccountId,
      bucket: activeBucket,
      prefix: effectivePrefix,
      limit: pageLimit,
      delimiter: '/',
    },
    Boolean(activeAccountId && activeBucket),
  );

  const features = useProviderFeaturesQuery(
    activeAccountId,
    Boolean(activeAccountId),
  );
  const featureList = features.data ?? [];
  const hasUrlUpload = featureList.includes('urlUpload');
  const hasCustomDomain = featureList.includes('customDomain');
  const hasRefreshCDN = featureList.includes('refreshCDN');
  const hasPrefetchCDN = featureList.includes('prefetchCDN');
  const hasVersioning = featureList.includes('versioning');

  const governanceFeatures = useMemo(
    () => ['lifecycle', 'cors', 'referer', 'encryption', 'versioning']
      .filter((f) => featureList.includes(f)),
    [featureList],
  );

  const domainsQuery = useDomainsQuery(
    activeAccountId,
    activeBucket,
    Boolean(activeAccountId && activeBucket && hasCustomDomain),
  );
  const domains = domainsQuery.data ?? [];

  const refetchBuckets = bucketsQuery.refetch;
  const refetchObjects = objectsQuery.refetch;

  // ---- 图片 key 列表（用于预览导航） ----
  const imageKeys = useMemo(
    () =>
      objects
        .filter(
          (o) =>
            !o.isDir
            && !o.key.endsWith('/')
            && (isImageKey(o.key)
              || o.mimeType?.startsWith('image/')),
        )
        .map((o) => o.key),
    [objects],
  );

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
      setPageMarker(objectsQuery.data.marker ?? '');
    }
  }, [objectsQuery.data, setObjects]);

  // 账户切换时重置
  useEffect(() => {
    if (prevAccountIdRef.current !== activeAccountId) {
      reset();
      setPrefix('');
      setSearchKeyword('');
      setSelectedKeys(new Set());
      setPageMarker('');
      prevAccountIdRef.current = activeAccountId;
    }
  }, [activeAccountId, reset]);

  // bucket 切换时重置目录、搜索和选中状态
  const prevBucketRef = useRef(activeBucket);
  useEffect(() => {
    if (prevBucketRef.current !== activeBucket) {
      setPrefix('');
      setSearchKeyword('');
      setSelectedKeys(new Set());
      setPageMarker('');
      prevBucketRef.current = activeBucket;
    }
  }, [activeBucket]);

  // prefix改变时清空选中和分页
  useEffect(() => {
    setSelectedKeys(new Set());
    setPageMarker('');
  }, [prefix, searchKeyword]);

  // ---- previewKey 变化时生成预览 URL ----
  useEffect(() => {
    if (!previewKey || !activeAccountId || !activeBucket) {
      setPreviewUrl('');
      setPreviewFileName('');
      return;
    }
    void generateUrl({
      accountId: activeAccountId,
      bucket: activeBucket,
      key: previewKey,
      https: settings.https,
    }).then((r) => {
      setPreviewUrl(r.url);
      setPreviewFileName(extractFileName(previewKey));
    });
  }, [
    previewKey, activeAccountId, activeBucket,
    generateUrl, settings.https,
  ]);

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

  /** 新建文件夹 */
  const onConfirmCreateFolder = useCallback(
    async (name: string) => {
      if (!activeAccountId || !activeBucket) return;
      try {
        await createFolder({
          accountId: activeAccountId,
          bucket: activeBucket,
          key: prefix + name,
        });
      } catch {
        // mutation hook 已处理 toast
      }
      setCreateFolderOpen(false);
      await refetchObjects();
    },
    [
      activeAccountId, activeBucket, prefix,
      createFolder, refetchObjects,
    ],
  );

  /** 触发删除确认（单个或批量） */
  const onRequestDelete = useCallback((key: string) => {
    setDeleteTargets([key]);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!activeAccountId || !activeBucket) return;
    try {
      await deleteObjects({
        accountId: activeAccountId,
        bucket: activeBucket,
        keys: deleteTargets,
      });
    } catch {
      // mutation hook 已处理 toast
    }
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
      const dir = renameTarget.includes('/')
        ? renameTarget.substring(
            0,
            renameTarget.lastIndexOf('/') + 1,
          )
        : '';
      try {
        await renameObject({
          accountId: activeAccountId,
          bucket: activeBucket,
          from: renameTarget,
          to: dir + newName,
        });
      } catch {
        // mutation hook 已处理 toast
      }
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
      // 优先使用用户保存的域名偏好，否则使用第一个 CDN 域名
      const pref = domainPrefs[activeBucket];
      const domain = pref?.domain
        || (domains.length > 0 ? domains[0] : undefined);
      const result = await generateUrl({
        accountId: activeAccountId,
        bucket: activeBucket,
        key,
        domain,
        https: settings.https,
      });
      const formatted = formatCopyUrl(
        result.url, key, settings.copyType,
      );
      try {
        if (tauriApi.isTauriEnv()) {
          await tauriApi.writeClipboardText(formatted);
        } else {
          await navigator.clipboard.writeText(formatted);
        }
        toast.success(t('toast.urlCopied'));
      } catch {
        // 复制失败时仍弹出 URL 对话框
      }
      setUrlDialogUrl(result.url);
      setUrlDialogKey(key);
    },
    [
      activeAccountId, activeBucket, domainPrefs, domains,
      generateUrl, settings.https, settings.copyType, t,
    ],
  );

  /** 快速复制URL（使用存储的域名偏好，不弹对话框） */
  const onQuickCopy = useCallback(
    async (key: string) => {
      if (!activeAccountId || !activeBucket) return;
      try {
        const pref = domainPrefs[activeBucket];
        const domain = pref?.domain
          || (domains.length > 0 ? domains[0] : undefined);
        const result = await generateUrl({
          accountId: activeAccountId,
          bucket: activeBucket,
          key,
          domain,
          https: settings.https,
        });
        const formatted = formatCopyUrl(
          result.url, key, settings.copyType,
        );
        if (tauriApi.isTauriEnv()) {
          await tauriApi.writeClipboardText(formatted);
        } else {
          await navigator.clipboard.writeText(formatted);
        }
        toast.success(t('toast.urlCopied'));
      } catch (err) {
        toast.error(
          (err as Error).message || t('toast.operationFailed'),
        );
      }
    },
    [
      activeAccountId, activeBucket, domainPrefs,
      generateUrl, settings, t,
    ],
  );

  /** 预览文件：设置 previewKey 触发 URL 生成 */
  const onPreview = useCallback(
    (key: string) => {
      if (getPreviewType(key) !== null) {
        setPreviewKey(key);
      }
    },
    [],
  );

  // ---- CDN 刷新 ----
  const onRefreshCDN = useCallback(
    async (key: string) => {
      if (!activeAccountId || !activeBucket) return;
      const pref = domainPrefs[activeBucket];
      const result = await generateUrl({
        accountId: activeAccountId,
        bucket: activeBucket,
        key,
        domain: pref?.domain || undefined,
        https: settings.https,
      });
      await refreshCDN.mutateAsync({
        accountId: activeAccountId,
        urls: [result.url],
      });
    },
    [
      activeAccountId, activeBucket, domainPrefs,
      generateUrl, settings.https, refreshCDN,
    ],
  );

  const handleBatchRefreshCDN = useCallback(async () => {
    if (!activeAccountId || !activeBucket) return;
    try {
      const pref = domainPrefs[activeBucket];
      const urls = await Promise.all(
        [...selectedKeys].map((key) =>
          generateUrl({
            accountId: activeAccountId,
            bucket: activeBucket,
            key,
            domain: pref?.domain || undefined,
            https: settings.https,
          }).then((r) => r.url),
        ),
      );
      await refreshCDN.mutateAsync({
        accountId: activeAccountId,
        urls,
      });
    } catch (err) {
      toast.error(
        (err as Error).message || t('toast.operationFailed'),
      );
    }
  }, [
    activeAccountId, activeBucket, domainPrefs,
    generateUrl, selectedKeys, settings.https,
    refreshCDN, t,
  ]);

  // ---- CDN 预热 ----
  const onPrefetchCDN = useCallback(
    async (key: string) => {
      if (!activeAccountId || !activeBucket) return;
      const pref = domainPrefs[activeBucket];
      const result = await generateUrl({
        accountId: activeAccountId,
        bucket: activeBucket,
        key,
        domain: pref?.domain || undefined,
        https: settings.https,
      });
      await prefetchCDN.mutateAsync({
        accountId: activeAccountId,
        urls: [result.url],
      });
    },
    [
      activeAccountId, activeBucket, domainPrefs,
      generateUrl, settings.https, prefetchCDN,
    ],
  );

  const handleBatchPrefetchCDN = useCallback(async () => {
    if (!activeAccountId || !activeBucket) return;
    try {
      const pref = domainPrefs[activeBucket];
      const urls = await Promise.all(
        [...selectedKeys].map((key) =>
          generateUrl({
            accountId: activeAccountId,
            bucket: activeBucket,
            key,
            domain: pref?.domain || undefined,
            https: settings.https,
          }).then((r) => r.url),
        ),
      );
      await prefetchCDN.mutateAsync({
        accountId: activeAccountId,
        urls,
      });
    } catch (err) {
      toast.error(
        (err as Error).message || t('toast.operationFailed'),
      );
    }
  }, [
    activeAccountId, activeBucket, domainPrefs,
    generateUrl, selectedKeys, settings.https,
    prefetchCDN, t,
  ]);

  // ---- 批量操作 ----
  const handleBatchDelete = useCallback(() => {
    setDeleteTargets(Array.from(selectedKeys));
  }, [selectedKeys]);

  const handleBatchDownload = useCallback(async () => {
    if (
      !tauriApi.isTauriEnv()
      || !activeAccountId || !activeBucket
    ) {
      return;
    }
    try {
      const selected = await tauriApi.openFolderDialog();
      const folder = selected[0];
      if (!folder) return;
      for (const key of selectedKeys) {
        const fileName = key.split('/').pop() || key;
        await queueDownload({
          accountId: activeAccountId,
          bucket: activeBucket,
          key,
          localPath: `${folder}/${fileName}`,
        });
      }
    } catch (err) {
      toast.error(
        (err as Error).message || t('toast.operationFailed'),
      );
    }
  }, [
    activeAccountId, activeBucket, selectedKeys,
    queueDownload, t,
  ]);

  const handleBatchCopyUrl = useCallback(async () => {
    if (!activeAccountId || !activeBucket) return;
    try {
      const lines: string[] = [];
      for (const key of selectedKeys) {
        const result = await generateUrl({
          accountId: activeAccountId,
          bucket: activeBucket,
          key,
          https: settings.https,
        });
        lines.push(
          formatCopyUrl(result.url, key, settings.copyType),
        );
      }
      const text = lines.join('\n');
      if (tauriApi.isTauriEnv()) {
        await tauriApi.writeClipboardText(text);
      } else {
        await navigator.clipboard.writeText(text);
      }
      toast.success(t('toast.urlCopied'));
    } catch (err) {
      toast.error(
        (err as Error).message || t('toast.operationFailed'),
      );
    }
  }, [
    activeAccountId,
    activeBucket,
    generateUrl,
    selectedKeys,
    settings.https,
    settings.copyType,
    t,
  ]);

  // ---- 加载更多 ----
  const handleLoadMore = useCallback(async () => {
    if (
      !activeAccountId || !activeBucket
      || !pageMarker || loadingMore
    ) {
      return;
    }
    setLoadingMore(true);
    try {
      const result = await cloudApi.listObjects({
        accountId: activeAccountId,
        bucket: activeBucket,
        prefix: effectivePrefix,
        limit: pageLimit,
        delimiter: '/',
        marker: pageMarker,
      });
      appendObjects(result.items, result.marker);
      setPageMarker(result.marker ?? '');
    } catch (err) {
      toast.error(
        (err as Error).message || t('toast.operationFailed'),
      );
    } finally {
      setLoadingMore(false);
    }
  }, [
    activeAccountId, activeBucket, pageMarker,
    loadingMore, effectivePrefix, pageLimit,
    appendObjects, t,
  ]);

  // ---- 文件夹导航 ----
  const navigateToFolder = useCallback((newPrefix: string) => {
    setPrefix(newPrefix);
    setSearchKeyword('');
    setPageMarker('');
  }, []);

  // ---- 刷新 ----
  const handleRefresh = useCallback(() => {
    void refetchBuckets();
    void refetchObjects();
  }, [refetchBuckets, refetchObjects]);


  // ---- 键盘导航 ----
  const { focusedIndex } = useKeyboardNavigation(objects, {
    onNavigateFolder: navigateToFolder,
    onPreview: (k) => void onPreview(k),
    onDelete: settings.hideDeleteButton
      ? undefined
      : onRequestDelete,
    onSelect: handleSelect,
    onRename: (k) => setRenameTarget(k),
    onUpload: () => void onClickUpload(),
    onRefresh: handleRefresh,
    onSelectAll: handleSelectAll,
    onClearSelection: clearSelection,
  });

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

  // ---- 上传完成后自动刷新 CDN ----
  useEffect(() => {
    if (!settings.autoRefreshCDN || !hasRefreshCDN) return;
    if (!activeAccountId || !activeBucket) return;

    const onUploadDone = (e: Event) => {
      const task = (e as CustomEvent).detail as {
        bucket: string; key: string;
      };
      if (task.bucket !== activeBucket) return;
      const pref = domainPrefs[activeBucket];
      void generateUrl({
        accountId: activeAccountId,
        bucket: activeBucket,
        key: task.key,
        domain: pref?.domain || undefined,
        https: settings.https,
      }).then((r) => {
        void refreshCDN.mutateAsync({
          accountId: activeAccountId,
          urls: [r.url],
        });
      });
    };

    window.addEventListener(
      'cloud-pika:upload-completed', onUploadDone,
    );
    return () => {
      window.removeEventListener(
        'cloud-pika:upload-completed', onUploadDone,
      );
    };
  }, [
    settings.autoRefreshCDN, settings.https, hasRefreshCDN,
    activeAccountId, activeBucket, domainPrefs,
    generateUrl, refreshCDN,
  ]);

  // ---- 提取重命名目标的文件名（不含目录路径） ----
  const renameFileName = useMemo(() => {
    if (!renameTarget) return '';
    const parts = renameTarget.split('/');
    return parts[parts.length - 1] || renameTarget;
  }, [renameTarget]);

  // ---- 预览导航计算 ----
  const previewIndex = imageKeys.indexOf(previewKey);

  // ---- 渲染 ----
  return (
    <div className="h-full" {...getRootProps()}>
      <input {...getInputProps()} />

      {/* 资源浏览区 */}
      <section className="h-full min-w-0 space-y-3 overflow-auto">
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
            onFetchUrl={
              hasUrlUpload
                ? () => setFetchDialogOpen(true)
                : undefined
            }
            onCreateFolder={() => setCreateFolderOpen(true)}
            onSettings={
              governanceFeatures.length > 0 && activeBucket
                ? () => setSettingsDrawerOpen(true)
                : undefined
            }
          />

          {/* 资源列表 */}
          {view === 'table' ? (
            <ResourceTable
              objects={objects}
              selectedKeys={selectedKeys}
              focusedIndex={focusedIndex}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onCopyUrl={(k) => void onCopyUrl(k)}
              onDelete={
                settings.hideDeleteButton
                  ? undefined
                  : onRequestDelete
              }
              onDownload={(k) => void onDownload(k)}
              onRename={onRequestRename}
              onPreview={(k) => void onPreview(k)}
              onNavigateFolder={navigateToFolder}
              onRefreshCDN={
                hasRefreshCDN
                  ? (k) => void onRefreshCDN(k)
                  : undefined
              }
              onPrefetchCDN={
                hasPrefetchCDN
                  ? (k) => void onPrefetchCDN(k)
                  : undefined
              }
              onQuickCopy={(k) => void onQuickCopy(k)}
              onVersionHistory={
                hasVersioning
                  ? (k) => setVersionHistoryKey(k)
                  : undefined
              }
              onUpload={() => void onClickUpload()}
              onRefresh={handleRefresh}
              onCreateFolder={() => setCreateFolderOpen(true)}
            />
          ) : (
            <ResourceGrid
              objects={objects}
              selectedKeys={selectedKeys}
              focusedIndex={focusedIndex}
              accountId={activeAccountId}
              bucket={activeBucket}
              onSelect={handleSelect}
              onCopyUrl={(k) => void onCopyUrl(k)}
              onDelete={
                settings.hideDeleteButton
                  ? undefined
                  : onRequestDelete
              }
              onDownload={(k) => void onDownload(k)}
              onRename={onRequestRename}
              onPreview={(k) => void onPreview(k)}
              onNavigateFolder={navigateToFolder}
              onRefreshCDN={
                hasRefreshCDN
                  ? (k) => void onRefreshCDN(k)
                  : undefined
              }
              onPrefetchCDN={
                hasPrefetchCDN
                  ? (k) => void onPrefetchCDN(k)
                  : undefined
              }
              onQuickCopy={(k) => void onQuickCopy(k)}
              onVersionHistory={
                hasVersioning
                  ? (k) => setVersionHistoryKey(k)
                  : undefined
              }
              onUpload={() => void onClickUpload()}
              onRefresh={handleRefresh}
              onCreateFolder={() => setCreateFolderOpen(true)}
            />
          )}

          {/* 加载更多 */}
          {pageMarker ? (
            <div className="flex justify-center py-3">
              <button
                type="button"
                onClick={() => void handleLoadMore()}
                disabled={loadingMore}
                className={[
                  'px-6 py-2 text-sm rounded-lg',
                  'ghost-border transition-colors',
                  'text-[var(--text-muted)]',
                  'hover:bg-[var(--surface-elevated)]',
                  'disabled:opacity-50',
                ].join(' ')}
              >
                {loadingMore
                  ? t('common.loading')
                  : t('bucket.loadMore')}
              </button>
            </div>
          ) : null}

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

      {/* 拖拽上传遮罩 */}
      <UploadZone isDragActive={isDragActive} />

      {/* 批量操作浮动栏 */}
      <SelectionBar
        count={selectedKeys.size}
        onBatchDownload={() => void handleBatchDownload()}
        onBatchCopyUrl={() => void handleBatchCopyUrl()}
        onBatchRefreshCDN={
          hasRefreshCDN
            ? () => void handleBatchRefreshCDN()
            : undefined
        }
        onBatchPrefetchCDN={
          hasPrefetchCDN
            ? () => void handleBatchPrefetchCDN()
            : undefined
        }
        onBatchDelete={
          settings.hideDeleteButton
            ? undefined
            : handleBatchDelete
        }
        onClearSelection={clearSelection}
      />

      {/* 新建文件夹对话框 */}
      <CreateFolderDialog
        open={createFolderOpen}
        onConfirm={(name) => void onConfirmCreateFolder(name)}
        onCancel={() => setCreateFolderOpen(false)}
      />

      {/* 版本历史对话框 */}
      <VersionHistoryDialog
        open={versionHistoryKey !== ''}
        objectKey={versionHistoryKey}
        accountId={activeAccountId}
        bucket={activeBucket}
        onClose={() => setVersionHistoryKey('')}
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
        objectKey={urlDialogKey}
        initialUrl={urlDialogUrl}
        domains={domains}
        domainPref={domainPrefs[activeBucket]}
        copyType={settings.copyType}
        https={settings.https}
        onClose={() => {
          setUrlDialogUrl('');
          setUrlDialogKey('');
        }}
        onRegenerate={async (domain, _signed) => {
          const r = await generateUrl({
            accountId: activeAccountId,
            bucket: activeBucket,
            key: urlDialogKey,
            domain: domain || undefined,
            https: settings.https,
          });
          return r.url;
        }}
        onSaveDomainPref={(pref) =>
          setDomainPref(activeBucket, pref)
        }
      />

      {/* 文件预览 */}
      <FilePreview
        open={previewUrl !== '' && previewKey !== ''}
        fileKey={previewKey}
        contentUrl={previewUrl}
        onClose={() => {
          setPreviewKey('');
          setPreviewUrl('');
          setPreviewFileName('');
        }}
        onPrev={
          previewIndex > 0
            ? () => setPreviewKey(imageKeys[previewIndex - 1])
            : undefined
        }
        onNext={
          previewIndex < imageKeys.length - 1
            ? () => setPreviewKey(imageKeys[previewIndex + 1])
            : undefined
        }
        currentIndex={
          previewIndex >= 0 ? previewIndex + 1 : undefined
        }
        totalCount={imageKeys.length}
      />

      {/* Bucket 治理设置抽屉 */}
      <BucketSettingsDrawer
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        accountId={activeAccountId}
        bucket={activeBucket}
        features={governanceFeatures}
      />
    </div>
  );
}
