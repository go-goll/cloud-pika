/**
 * ResourceGrid - 文件资源网格视图组件
 * 支持Checkbox多选、缩略图占位、文件类型图标区分
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import {
  extractFileName,
  formatFileSize,
  isImageKey,
} from '@/lib/format';
import { ResourceContextMenu } from '@/components/bucket/ResourceContextMenu';

interface ResourceGridProps {
  objects: ObjectItem[];
  selectedKeys: Set<string>;
  onSelect: (key: string, shiftKey: boolean) => void;
  onCopyUrl?: (key: string) => void;
  onDelete?: (key: string) => void;
  onDownload?: (key: string) => void;
  onRename?: (key: string) => void;
  onNavigateFolder?: (prefix: string) => void;
  onUpload?: () => void;
  onRefresh?: () => void;
}

/** 根据mimeType或文件名返回对应图标 */
function getFileIcon(key: string, mimeType?: string) {
  if (key.endsWith('/')) {
    return (
      <Folder size={28} className="text-[var(--primary)]" />
    );
  }
  if (isImageKey(key) || mimeType?.startsWith('image/')) {
    return (
      <Image size={28} className="text-[var(--primary-soft)]" />
    );
  }
  if (mimeType?.startsWith('video/')) {
    return <FileVideo size={28} className="text-[var(--text-muted)]" />;
  }
  if (mimeType?.startsWith('audio/')) {
    return <FileAudio size={28} className="text-[var(--text-muted)]" />;
  }
  if (mimeType?.startsWith('text/')) {
    return <FileText size={28} className="text-[var(--text-muted)]" />;
  }
  // 压缩文件
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
    return (
      <FileArchive size={28} className="text-[var(--text-muted)]" />
    );
  }
  // 代码文件
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'yml', 'yaml', 'xml', 'html', 'css'].includes(ext)) {
    return <FileCode size={28} className="text-[var(--text-muted)]" />;
  }
  return <File size={28} className="text-[var(--text-muted)]" />;
}

/** 卡片操作菜单 */
function CardActionMenu({
  objectKey,
  onCopyUrl,
  onDownload,
  onRename,
  onDelete,
}: {
  objectKey: string;
  onCopyUrl?: (key: string) => void;
  onDownload?: (key: string) => void;
  onRename?: (key: string) => void;
  onDelete?: (key: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

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
          'rounded-[var(--radius)] transition-colors',
          'hover:bg-[var(--surface-elevated)]',
          'text-[var(--text-muted)]',
        ].join(' ')}
      >
        <MoreHorizontal size={14} />
      </button>

      {open ? (
        <div
          className={[
            'absolute right-0 top-7 z-30 min-w-[140px]',
            'rounded-[calc(var(--radius)+2px)] p-1',
            'bg-[var(--surface-high)]',
            'border border-[var(--outline)]',
            'shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
          ].join(' ')}
          onMouseLeave={() => setOpen(false)}
        >
          {[
            {
              label: t('bucket.copyUrl'),
              action: () => onCopyUrl?.(objectKey),
            },
            {
              label: t('bucket.download'),
              action: () => onDownload?.(objectKey),
            },
            {
              label: t('bucket.rename'),
              action: () => onRename?.(objectKey),
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.action();
                setOpen(false);
              }}
              className={[
                'flex w-full items-center px-3 py-1.5',
                'text-xs rounded-[var(--radius)]',
                'hover:bg-[var(--surface-elevated)]',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
          <div className="my-1 h-px bg-[var(--outline)]" />
          <button
            type="button"
            onClick={() => {
              onDelete?.(objectKey);
              setOpen(false);
            }}
            className={[
              'flex w-full items-center px-3 py-1.5',
              'text-xs text-[var(--danger)]',
              'rounded-[var(--radius)]',
              'hover:bg-[var(--surface-elevated)]',
            ].join(' ')}
          >
            {t('bucket.delete')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ResourceGrid({
  objects,
  selectedKeys,
  onSelect,
  onCopyUrl,
  onDelete,
  onDownload,
  onRename,
  onNavigateFolder,
  onUpload,
  onRefresh,
}: ResourceGridProps) {
  const { t } = useTranslation();

  return (
    <ResourceContextMenu
      blankActions={
        onUpload && onRefresh
          ? { onUpload, onRefresh }
          : undefined
      }
    >
      <div
        className={
          'grid grid-cols-2 gap-3 '
          + 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        }
      >
        {objects.map((item, index) => {
          const isSelected = selectedKeys.has(item.key);
          const isDir = item.isDir || item.key.endsWith('/');
          const fileName = extractFileName(item.key);
          const isImage =
            isImageKey(item.key)
            || item.mimeType?.startsWith('image/');

          return (
            <ResourceContextMenu
              key={item.key}
              fileActions={{
                onCopyUrl: () => onCopyUrl?.(item.key),
                onDownload: () => onDownload?.(item.key),
                onRename: () => onRename?.(item.key),
                onDelete: () => onDelete?.(item.key),
              }}
            >
              <Card
                className={[
                  'animate-row-in group relative',
                  'cursor-default transition-all duration-200',
                  'hover:-translate-y-[1px] hover:shadow-md',
                  isSelected
                    ? 'ring-2 ring-[var(--primary)] '
                      + 'bg-[color-mix(in_srgb,'
                      + 'var(--primary)_5%,'
                      + 'var(--surface-high))]'
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
                        (e.nativeEvent as MouseEvent).shiftKey,
                      );
                    }}
                    className={[
                      'cursor-pointer accent-[var(--primary)]',
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
                    onCopyUrl={onCopyUrl}
                    onDownload={onDownload}
                    onRename={onRename}
                    onDelete={onDelete}
                  />
                </div>

                {/* 缩略图/图标区域 */}
                <div
                  className={[
                    'flex h-24 items-center justify-center',
                    'rounded-[var(--radius)]',
                    isImage
                      ? 'bg-[var(--surface-low)]'
                      : '',
                  ].join(' ')}
                  onDoubleClick={() => {
                    if (isDir) onNavigateFolder?.(item.key);
                  }}
                >
                  {getFileIcon(item.key, item.mimeType)}
                </div>

                {/* 文件信息 */}
                <div className="mt-2">
                  <p
                    className="truncate text-sm font-medium"
                    title={item.key}
                  >
                    {fileName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {isDir ? t('bucket.folder') : formatFileSize(item.size)}
                  </p>
                </div>
              </Card>
            </ResourceContextMenu>
          );
        })}

        {objects.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-[var(--text-muted)]">
            {t('bucket.empty')}
          </p>
        ) : null}
      </div>
    </ResourceContextMenu>
  );
}
