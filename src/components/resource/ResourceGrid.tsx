/**
 * ResourceGrid - 文件资源网格视图组件
 * 支持Checkbox多选、缩略图占位、文件类型图标区分
 * 大数据量时启用虚拟滚动
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Copy, Eye, MoreHorizontal } from 'lucide-react';
import type { ObjectItem } from '@/types/cloud';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  extractFileName,
  formatFileSize,
  isImageKey,
} from '@/lib/format';
import { getFileIcon, getIconBg } from '@/lib/file-icon';
import { getPreviewType } from '@/lib/preview-type';
import { useThumbnail } from '@/hooks/useThumbnail';
import { ResourceContextMenu } from '@/components/bucket/ResourceContextMenu';

/** 启用虚拟滚动的阈值 */
const VIRTUAL_THRESHOLD = 100;

/** 单张卡片估计高度（含 padding 和 gap） */
const CARD_HEIGHT = 200;

interface ResourceGridProps {
  objects: ObjectItem[];
  selectedKeys: Set<string>;
  accountId: string;
  bucket: string;
  onSelect: (key: string, shiftKey: boolean) => void;
  onCopyUrl?: (key: string) => void;
  onDelete?: (key: string) => void;
  onDownload?: (key: string) => void;
  onRename?: (key: string) => void;
  onPreview?: (key: string) => void;
  onNavigateFolder?: (prefix: string) => void;
  onQuickCopy?: (key: string) => void;
  onRefreshCDN?: (key: string) => void;
  onPrefetchCDN?: (key: string) => void;
  onVersionHistory?: (key: string) => void;
  onUpload?: () => void;
  onRefresh?: () => void;
  onFetchUrl?: () => void;
  onCreateFolder?: () => void;
  focusedIndex?: number;
}

/** 缩略图卡片图标区域（支持懒加载缩略图） */
function ThumbnailArea({
  objectKey,
  mimeType,
  isDir,
  isImage,
  accountId,
  bucket,
  onDoubleClick,
}: {
  objectKey: string;
  mimeType?: string;
  isDir: boolean;
  isImage: boolean;
  accountId: string;
  bucket: string;
  onDoubleClick?: () => void;
}) {
  const { url, loading, error, containerRef } = useThumbnail(
    objectKey, bucket, accountId, isImage,
  );
  const [imgError, setImgError] = useState(false);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center py-3"
      onDoubleClick={onDoubleClick}
    >
      {isImage && loading ? (
        <Skeleton className="h-20 w-20 rounded-xl" />
      ) : isImage && url && !error && !imgError ? (
        <img
          src={url}
          alt={objectKey}
          loading="lazy"
          className="h-20 w-20 rounded-xl object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={[
            'flex h-14 w-14 items-center justify-center rounded-xl',
            getIconBg(objectKey, mimeType),
          ].join(' ')}
        >
          {getFileIcon(objectKey, mimeType, 28)}
        </div>
      )}
    </div>
  );
}

/** 卡片操作菜单 */
function CardActionMenu({
  objectKey,
  canPreview,
  onCopyUrl,
  onDownload,
  onRename,
  onDelete,
  onPreview,
}: {
  objectKey: string;
  canPreview: boolean;
  onCopyUrl?: (key: string) => void;
  onDownload?: (key: string) => void;
  onRename?: (key: string) => void;
  onDelete?: (key: string) => void;
  onPreview?: (key: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const menuItems = [
    ...(canPreview && onPreview
      ? [{
          label: t('bucket.preview'),
          icon: <Eye size={12} />,
          action: () => onPreview(objectKey),
        }]
      : []),
    {
      label: t('bucket.copyUrl'),
      icon: null,
      action: () => onCopyUrl?.(objectKey),
    },
    {
      label: t('bucket.download'),
      icon: null,
      action: () => onDownload?.(objectKey),
    },
    {
      label: t('bucket.rename'),
      icon: null,
      action: () => onRename?.(objectKey),
    },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={[
          'flex h-6 w-6 items-center justify-center',
          'rounded-lg transition-colors',
          'hover:bg-surface-container-low',
          'text-on-surface-variant',
        ].join(' ')}
      >
        <MoreHorizontal size={14} />
      </button>

      {open ? (
        <div
          className={[
            'absolute right-0 top-7 z-30',
            'min-w-[140px] rounded-xl p-1',
            'bg-surface-container-lowest',
            'ghost-border shadow-ambient',
          ].join(' ')}
          onMouseLeave={() => setOpen(false)}
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.action();
                setOpen(false);
              }}
              className={[
                'flex w-full items-center gap-1.5 px-3 py-1.5',
                'text-xs rounded-[var(--radius)]',
                'hover:bg-[var(--surface-elevated)]',
              ].join(' ')}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          {onDelete ? (
            <>
              <div className="my-1 h-px bg-outline-variant" />
              <button
                type="button"
                onClick={() => {
                  onDelete(objectKey);
                  setOpen(false);
                }}
                className={[
                  'flex w-full items-center px-3 py-1.5',
                  'text-xs text-danger rounded-lg',
                  'hover:bg-surface-container-low',
                ].join(' ')}
              >
                {t('bucket.delete')}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** 根据容器宽度计算每行列数 */
function useColumns(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [cols, setCols] = useState(4);

  const updateCols = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w < 640) setCols(2);
    else if (w < 1024) setCols(3);
    else if (w < 1280) setCols(4);
    else setCols(5);
  }, [containerRef]);

  // 监听容器尺寸变化
  const observerRef = useRef<ResizeObserver | null>(null);
  const bindRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      if (!node) return;
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      updateCols();
      observerRef.current = new ResizeObserver(updateCols);
      observerRef.current.observe(node);
    },
    [containerRef, updateCols],
  );

  return { cols, bindRef };
}

/** 渲染单张卡片 */
function GridCard({
  item,
  index,
  isSelected,
  isFocused,
  accountId,
  bucket,
  onSelect,
  onCopyUrl,
  onDelete,
  onDownload,
  onRename,
  onPreview,
  onNavigateFolder,
  onQuickCopy,
  onRefreshCDN,
  onPrefetchCDN,
  onVersionHistory,
}: {
  item: ObjectItem;
  index: number;
  isSelected: boolean;
  isFocused: boolean;
  accountId: string;
  bucket: string;
  onSelect: (key: string, shiftKey: boolean) => void;
  onCopyUrl?: (key: string) => void;
  onDelete?: (key: string) => void;
  onDownload?: (key: string) => void;
  onRename?: (key: string) => void;
  onPreview?: (key: string) => void;
  onNavigateFolder?: (prefix: string) => void;
  onQuickCopy?: (key: string) => void;
  onRefreshCDN?: (key: string) => void;
  onPrefetchCDN?: (key: string) => void;
  onVersionHistory?: (key: string) => void;
}) {
  const { t } = useTranslation();
  const isDir = item.isDir || item.key.endsWith('/');
  const fileName = extractFileName(item.key);
  const isImage = !isDir
    && (isImageKey(item.key)
      || Boolean(item.mimeType?.startsWith('image/')));
  const canPreview = !isDir && getPreviewType(item.key) !== null;

  return (
    <ResourceContextMenu
      fileActions={{
        onCopyUrl: () => onCopyUrl?.(item.key),
        onDownload: () => onDownload?.(item.key),
        onRename: () => onRename?.(item.key),
        onDelete: () => onDelete?.(item.key),
        onPreview: canPreview
          ? () => onPreview?.(item.key)
          : undefined,
        onRefreshCDN: onRefreshCDN
          ? () => onRefreshCDN(item.key)
          : undefined,
        onPrefetchCDN: onPrefetchCDN
          ? () => onPrefetchCDN(item.key)
          : undefined,
        onVersionHistory: onVersionHistory
          ? () => onVersionHistory(item.key)
          : undefined,
      }}
    >
      <Card
        hoverable
        className={[
          'animate-row-in group relative p-5',
          'cursor-default',
          isSelected
            ? 'ring-2 ring-[var(--accent)] ring-offset-2'
            : '',
          isFocused && !isSelected
            ? 'ring-1 ring-[var(--accent)]/30'
            : '',
        ].join(' ')}
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {/* 左上角 Checkbox */}
        <div className="absolute left-3 top-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              onSelect(
                item.key,
                (e.nativeEvent as MouseEvent).shiftKey,
              );
            }}
            className={[
              'cursor-pointer accent-primary',
              isSelected
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100',
              'transition-opacity',
            ].join(' ')}
          />
        </div>

        {/* 右上角操作菜单 */}
        <div
          className={[
            'absolute right-3 top-3 z-10',
            'opacity-0 group-hover:opacity-100',
            'transition-opacity',
          ].join(' ')}
        >
          <CardActionMenu
            objectKey={item.key}
            canPreview={canPreview}
            onCopyUrl={onCopyUrl}
            onDownload={onDownload}
            onRename={onRename}
            onDelete={onDelete}
            onPreview={onPreview}
          />
        </div>

        {/* 缩略图/图标区域 */}
        <ThumbnailArea
          objectKey={item.key}
          mimeType={item.mimeType}
          isDir={isDir}
          isImage={isImage}
          accountId={accountId}
          bucket={bucket}
          onDoubleClick={
            isDir
              ? () => onNavigateFolder?.(item.key)
              : undefined
          }
        />

        {/* 文件信息 */}
        <div className="mt-3">
          <div className="flex items-center gap-1">
            <p
              className="truncate text-sm font-medium text-[var(--text)]"
              title={item.key}
            >
              {fileName}
            </p>
            {!isDir && onQuickCopy ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickCopy(item.key);
                }}
                className={[
                  'ml-auto shrink-0 flex h-5 w-5',
                  'items-center justify-center',
                  'rounded-lg transition-all',
                  'hover:bg-[var(--accent-soft)]',
                  'text-[var(--text-secondary)]',
                  'hover:text-[var(--accent)]',
                  'opacity-0 group-hover:opacity-100',
                ].join(' ')}
                title={t('bucket.quickCopy')}
              >
                <Copy size={12} />
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {isDir ? t('bucket.folder') : formatFileSize(item.size)}
          </p>
        </div>
      </Card>
    </ResourceContextMenu>
  );
}

export function ResourceGrid({
  objects,
  selectedKeys,
  accountId,
  bucket,
  onSelect,
  onCopyUrl,
  onDelete,
  onDownload,
  onRename,
  onPreview,
  onNavigateFolder,
  onQuickCopy,
  onRefreshCDN,
  onPrefetchCDN,
  onUpload,
  onRefresh,
  onVersionHistory,
  onFetchUrl,
  onCreateFolder,
  focusedIndex,
}: ResourceGridProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { cols, bindRef } = useColumns(containerRef);

  const useVirtual = objects.length > VIRTUAL_THRESHOLD;
  const rowCount = Math.ceil(objects.length / cols);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => CARD_HEIGHT,
    overscan: 3,
    enabled: useVirtual,
  });

  /** 渲染一行卡片 */
  const renderRow = useCallback(
    (rowIdx: number) => {
      const start = rowIdx * cols;
      const end = Math.min(start + cols, objects.length);
      const items = objects.slice(start, end);

      return items.map((item, colIdx) => {
        const globalIdx = start + colIdx;
        return (
          <GridCard
            key={item.key}
            item={item}
            index={globalIdx}
            isSelected={selectedKeys.has(item.key)}
            isFocused={globalIdx === focusedIndex}
            accountId={accountId}
            bucket={bucket}
            onSelect={onSelect}
            onCopyUrl={onCopyUrl}
            onDelete={onDelete}
            onDownload={onDownload}
            onRename={onRename}
            onPreview={onPreview}
            onNavigateFolder={onNavigateFolder}
            onQuickCopy={onQuickCopy}
            onRefreshCDN={onRefreshCDN}
            onPrefetchCDN={onPrefetchCDN}
            onVersionHistory={onVersionHistory}
          />
        );
      });
    },
    [
      cols, objects, selectedKeys, focusedIndex,
      accountId, bucket, onSelect, onCopyUrl, onDelete,
      onDownload, onRename, onPreview, onNavigateFolder,
      onQuickCopy, onRefreshCDN, onPrefetchCDN,
    ],
  );

  const gridColsClass = useMemo(() => {
    const map: Record<number, string> = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
    };
    return map[cols] ?? 'grid-cols-4';
  }, [cols]);

  return (
    <ResourceContextMenu
      blankActions={
        onUpload && onRefresh
          ? { onUpload, onRefresh, onFetchUrl, onCreateFolder }
          : undefined
      }
    >
      {useVirtual ? (
        <div
          ref={bindRef}
          className="max-h-[70vh] overflow-auto"
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: 'relative',
              width: '100%',
            }}
          >
            {virtualizer.getVirtualItems().map((vRow) => (
              <div
                key={vRow.index}
                className={`grid ${gridColsClass} gap-4`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vRow.start}px)`,
                  height: `${vRow.size}px`,
                  padding: '4px 0',
                }}
              >
                {renderRow(vRow.index)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          ref={bindRef}
          className={`grid ${gridColsClass} gap-4`}
        >
          {objects.map((item, index) => (
            <GridCard
              key={item.key}
              item={item}
              index={index}
              isSelected={selectedKeys.has(item.key)}
              isFocused={index === focusedIndex}
              accountId={accountId}
              bucket={bucket}
              onSelect={onSelect}
              onCopyUrl={onCopyUrl}
              onDelete={onDelete}
              onDownload={onDownload}
              onRename={onRename}
              onPreview={onPreview}
              onNavigateFolder={onNavigateFolder}
              onQuickCopy={onQuickCopy}
              onRefreshCDN={onRefreshCDN}
              onPrefetchCDN={onPrefetchCDN}
            />
          ))}

          {objects.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-on-surface-variant">
              {t('bucket.empty')}
            </p>
          ) : null}
        </div>
      )}
    </ResourceContextMenu>
  );
}
