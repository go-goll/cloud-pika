/**
 * ResourceGrid - 文件资源网格视图组件
 * 支持Checkbox多选、缩略图占位、文件类型图标区分
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Copy,
  Eye,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileText,
  FileVideo,
  Folder,
  Image,
  MoreHorizontal,
} from 'lucide-react';
import type { ObjectItem } from '@/types/cloud';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  extractFileName,
  formatFileSize,
  isImageKey,
} from '@/lib/format';
import { useThumbnail } from '@/hooks/useThumbnail';
import { ResourceContextMenu } from '@/components/bucket/ResourceContextMenu';

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
  onUpload?: () => void;
  onRefresh?: () => void;
  onFetchUrl?: () => void;
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
    objectKey,
    bucket,
    accountId,
    isImage,
  );
  const [imgError, setImgError] = useState(false);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center py-3"
      onDoubleClick={onDoubleClick}
    >
      {/* 图片缩略图：加载中显示骨架屏 */}
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

/** 文件类型对应的图标容器背景色 */
function getIconBg(key: string, mimeType?: string): string {
  if (key.endsWith('/')) return 'bg-blue-500/10';
  if (isImageKey(key) || mimeType?.startsWith('image/')) return 'bg-emerald-500/10';
  if (mimeType?.startsWith('video/')) return 'bg-purple-500/10';
  if (mimeType?.startsWith('audio/')) return 'bg-amber-500/10';
  if (mimeType?.startsWith('text/')) return 'bg-gray-500/10';
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return 'bg-violet-500/10';
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'yml', 'yaml', 'xml', 'html', 'css'].includes(ext)) {
    return 'bg-cyan-500/10';
  }
  return 'bg-gray-500/10';
}

/** 根据mimeType或文件名返回对应图标（大尺寸用于网格） */
function getFileIcon(key: string, mimeType?: string, size = 28) {
  if (key.endsWith('/')) {
    return <Folder size={size} className="icon-folder" />;
  }
  if (isImageKey(key) || mimeType?.startsWith('image/')) {
    return <Image size={size} className="icon-image" />;
  }
  if (mimeType?.startsWith('video/')) {
    return <FileVideo size={size} className="icon-video" />;
  }
  if (mimeType?.startsWith('audio/')) {
    return <FileAudio size={size} className="icon-audio" />;
  }
  if (mimeType?.startsWith('text/')) {
    return <FileText size={size} className="icon-text" />;
  }
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
    return <FileArchive size={size} className="icon-archive" />;
  }
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'yml', 'yaml', 'xml', 'html', 'css'].includes(ext)) {
    return <FileCode size={size} className="icon-code" />;
  }
  return <File size={size} className="icon-file" />;
}

/** 卡片操作菜单 */
function CardActionMenu({
  objectKey,
  isImage,
  onCopyUrl,
  onDownload,
  onRename,
  onDelete,
  onPreview,
}: {
  objectKey: string;
  isImage: boolean;
  onCopyUrl?: (key: string) => void;
  onDownload?: (key: string) => void;
  onRename?: (key: string) => void;
  onDelete?: (key: string) => void;
  onPreview?: (key: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const menuItems = [
    ...(isImage && onPreview
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
  onUpload,
  onRefresh,
  onFetchUrl,
  focusedIndex,
}: ResourceGridProps) {
  const { t } = useTranslation();

  return (
    <ResourceContextMenu
      blankActions={
        onUpload && onRefresh
          ? { onUpload, onRefresh, onFetchUrl }
          : undefined
      }
    >
      <div
        className={
          'grid grid-cols-2 gap-4 '
          + 'sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        }
      >
        {objects.map((item, index) => {
          const isSelected = selectedKeys.has(item.key);
          const isDir =
            item.isDir || item.key.endsWith('/');
          const fileName = extractFileName(item.key);
          const isImage =
            !isDir
            && (isImageKey(item.key)
              || Boolean(item.mimeType?.startsWith('image/')));

          return (
            <ResourceContextMenu
              key={item.key}
              fileActions={{
                onCopyUrl: () => onCopyUrl?.(item.key),
                onDownload: () => onDownload?.(item.key),
                onRename: () => onRename?.(item.key),
                onDelete: () => onDelete?.(item.key),
                onPreview: isImage
                  ? () => onPreview?.(item.key)
                  : undefined,
                onRefreshCDN: onRefreshCDN
                  ? () => onRefreshCDN(item.key)
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
                  index === focusedIndex && !isSelected
                    ? 'ring-1 ring-[var(--accent)]/30'
                    : '',
                ].join(' ')}
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
              >
                {/* 左上角Checkbox */}
                <div className="absolute left-3 top-3 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      onSelect(
                        item.key,
                        (
                          e.nativeEvent as MouseEvent
                        ).shiftKey,
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
                    isImage={isImage}
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
                    {isDir
                      ? t('bucket.folder')
                      : formatFileSize(item.size)}
                  </p>
                </div>
              </Card>
            </ResourceContextMenu>
          );
        })}

        {objects.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-on-surface-variant">
            {t('bucket.empty')}
          </p>
        ) : null}
      </div>
    </ResourceContextMenu>
  );
}
