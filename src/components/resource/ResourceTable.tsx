/**
 * ResourceTable - 文件资源表格视图组件
 * 支持Checkbox多选、列排序、行操作菜单、文件夹双击进入
 * 大数据量时启用虚拟滚动
 */
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  File,
  Folder,
  MoreHorizontal,
} from 'lucide-react';
import type { ObjectItem } from '@/types/cloud';
import {
  extractFileName,
  formatFileSize,
  formatRelativeTime,
  isImageKey,
} from '@/lib/format';
import { ResourceContextMenu } from '@/components/bucket/ResourceContextMenu';

/** 排序方向 */
type SortDir = 'asc' | 'desc';

/** 可排序列名 */
type SortColumn = 'key' | 'size' | 'lastModified';

interface ResourceTableProps {
  objects: ObjectItem[];
  selectedKeys: Set<string>;
  onSelect: (key: string, shiftKey: boolean) => void;
  onSelectAll: () => void;
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

/** 启用虚拟滚动的阈值 */
const VIRTUAL_THRESHOLD = 100;

/** 虚拟滚动行高估计值 */
const ROW_HEIGHT = 36;

/** 行操作下拉菜单 */
function RowActionMenu({
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
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (!menuRef.current?.contains(e.relatedTarget)) {
        setOpen(false);
      }
    },
    [],
  );

  return (
    <div
      className="relative"
      ref={menuRef}
      onBlur={handleBlur}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={[
          'flex h-6 w-6 items-center justify-center',
          'rounded transition-colors',
          'hover:bg-[var(--bg-raised)]',
          'text-[var(--text-secondary)]',
          'opacity-0 group-hover:opacity-100',
        ].join(' ')}
      >
        <MoreHorizontal size={14} />
      </button>

      {open ? (
        <div
          className={[
            'absolute right-0 top-7 z-30',
            'min-w-[140px] rounded-lg p-1',
            'bg-[var(--bg-raised)]',
            'border border-[var(--border)] shadow-lg',
          ].join(' ')}
        >
          {isImage && onPreview ? (
            <ActionItem
              label={t('bucket.preview')}
              icon={<Eye size={14} />}
              onClick={() => {
                onPreview(objectKey);
                setOpen(false);
              }}
            />
          ) : null}
          <ActionItem
            label={t('bucket.copyUrl')}
            onClick={() => {
              onCopyUrl?.(objectKey);
              setOpen(false);
            }}
          />
          <ActionItem
            label={t('bucket.download')}
            onClick={() => {
              onDownload?.(objectKey);
              setOpen(false);
            }}
          />
          <ActionItem
            label={t('bucket.rename')}
            onClick={() => {
              onRename?.(objectKey);
              setOpen(false);
            }}
          />
          {onDelete ? (
            <>
              <div className="my-1 h-px bg-outline-variant" />
              <ActionItem
                label={t('bucket.delete')}
                danger
                onClick={() => {
                  onDelete(objectKey);
                  setOpen(false);
                }}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** 下拉菜单项 */
function ActionItem({
  label,
  icon,
  danger,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2 px-2.5 py-1 text-xs',
        'rounded transition-colors',
        'hover:bg-[var(--accent-soft)]',
        danger ? 'text-[var(--danger)]' : '',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

/** 排序图标 */
function SortIcon({
  column,
  activeColumn,
  dir,
}: {
  column: SortColumn;
  activeColumn: SortColumn | null;
  dir: SortDir;
}) {
  if (activeColumn !== column) return null;
  return dir === 'asc' ? (
    <ArrowUp size={12} className="ml-1 inline" />
  ) : (
    <ArrowDown size={12} className="ml-1 inline" />
  );
}

export function ResourceTable({
  objects,
  selectedKeys,
  onSelect,
  onSelectAll,
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
}: ResourceTableProps) {
  const { t } = useTranslation();
  const [sortCol, setSortCol] =
    useState<SortColumn | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 切换排序列
  const toggleSort = useCallback((col: SortColumn) => {
    setSortCol((prev) => {
      if (prev === col) {
        setSortDir((d) =>
          d === 'asc' ? 'desc' : 'asc',
        );
        return col;
      }
      setSortDir('asc');
      return col;
    });
  }, []);

  // 排序后的对象列表
  const sortedObjects = useMemo(() => {
    if (!sortCol) return objects;
    const sorted = [...objects];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'key') {
        cmp = a.key.localeCompare(b.key);
      } else if (sortCol === 'size') {
        cmp = a.size - b.size;
      } else if (sortCol === 'lastModified') {
        const ta = a.lastModified
          ? new Date(a.lastModified).getTime()
          : 0;
        const tb = b.lastModified
          ? new Date(b.lastModified).getTime()
          : 0;
        cmp = ta - tb;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [objects, sortCol, sortDir]);

  // 是否启用虚拟滚动
  const useVirtual =
    sortedObjects.length > VIRTUAL_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: sortedObjects.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    enabled: useVirtual,
  });

  const allSelected =
    objects.length > 0 &&
    objects.every((o) => selectedKeys.has(o.key));

  const thClass = [
    'px-4 py-3 cursor-pointer select-none',
    'text-[10px] uppercase tracking-[0.05em]',
    'text-[var(--text-secondary)] font-bold',
    'hover:text-[var(--text)] transition-colors',
  ].join(' ');

  /** 渲染单行 */
  const renderRow = (
    item: ObjectItem,
    style?: React.CSSProperties,
    rowIndex?: number,
  ) => {
    const isSelected = selectedKeys.has(item.key);
    const isFocused =
      rowIndex !== undefined && rowIndex === focusedIndex;
    const isDir =
      item.isDir || item.key.endsWith('/');
    const fileName = extractFileName(item.key);
    const itemIsImage =
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
          onPreview:
            itemIsImage && !isDir
              ? () => onPreview?.(item.key)
              : undefined,
          onRefreshCDN: onRefreshCDN
            ? () => onRefreshCDN(item.key)
            : undefined,
        }}
      >
        <tr
          style={style}
          className={[
            'group rounded-xl transition-colors duration-150',
            'cursor-default',
            isFocused
              ? 'ring-1 ring-[var(--accent)]/30 bg-[var(--accent-soft)]'
              : isSelected
                ? 'bg-[var(--accent-soft)]'
                : 'hover:bg-[rgba(234,239,242,0.4)]',
          ].join(' ')}
          onDoubleClick={() => {
            if (isDir) onNavigateFolder?.(item.key);
          }}
        >
          {/* Checkbox */}
          <td className="w-8 px-4 py-3.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                onSelect(
                  item.key,
                  (e.nativeEvent as MouseEvent)
                    .shiftKey,
                );
              }}
              className="cursor-pointer accent-[var(--accent)]"
            />
          </td>

          {/* 文件名 */}
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2 w-full">
              {isDir ? (
                <Folder
                  size={24}
                  className="shrink-0 icon-folder"
                />
              ) : (
                <File
                  size={24}
                  className="shrink-0 icon-file"
                />
              )}
              <span
                className={[
                  'truncate text-sm font-medium',
                  isDir
                    ? 'text-[var(--accent)]'
                    : '',
                ].join(' ')}
                title={item.key}
              >
                {fileName}
              </span>
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
                    'rounded transition-colors',
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
          </td>

          {/* 大小 */}
          <td className="px-4 py-3.5 text-sm text-[var(--text-secondary)]">
            {isDir ? '-' : formatFileSize(item.size)}
          </td>

          {/* 更新时间 */}
          <td className="px-4 py-3.5 text-sm text-[var(--text-secondary)]">
            {item.lastModified
              ? formatRelativeTime(item.lastModified)
              : '-'}
          </td>

          {/* 操作 */}
          <td className="px-4 py-3.5">
            <RowActionMenu
              objectKey={item.key}
              isImage={Boolean(itemIsImage) && !isDir}
              onCopyUrl={onCopyUrl}
              onDownload={onDownload}
              onRename={onRename}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          </td>
        </tr>
      </ResourceContextMenu>
    );
  };

  return (
    <ResourceContextMenu
      blankActions={
        onUpload && onRefresh
          ? { onUpload, onRefresh, onFetchUrl }
          : undefined
      }
    >
      <div
        ref={scrollRef}
        className={[
          'rounded-xl',
          useVirtual ? 'max-h-[70vh] overflow-auto' : '',
        ].join(' ')}
      >
        <table className="w-full text-[13px]">
          <thead
            className={[
              'text-left',
              'sticky top-0 z-10',
              'bg-[var(--bg)]',
            ].join(' ')}
          >
            <tr>
              {/* 全选Checkbox */}
              <th className="w-8 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="cursor-pointer accent-[var(--accent)]"
                />
              </th>
              <th
                className={thClass}
                onClick={() => toggleSort('key')}
              >
                Key
                <SortIcon
                  column="key"
                  activeColumn={sortCol}
                  dir={sortDir}
                />
              </th>
              <th
                className={thClass}
                onClick={() => toggleSort('size')}
              >
                Size
                <SortIcon
                  column="size"
                  activeColumn={sortCol}
                  dir={sortDir}
                />
              </th>
              <th
                className={thClass}
                onClick={() => toggleSort('lastModified')}
              >
                Updated
                <SortIcon
                  column="lastModified"
                  activeColumn={sortCol}
                  dir={sortDir}
                />
              </th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>

          {/* 虚拟滚动模式 */}
          {useVirtual ? (
            <tbody
              style={{
                height: virtualizer.getTotalSize(),
                position: 'relative',
              }}
            >
              {virtualizer
                .getVirtualItems()
                .map((vItem) => {
                  const item =
                    sortedObjects[vItem.index];
                  return renderRow(
                    item,
                    {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${vItem.size}px`,
                      transform: `translateY(${vItem.start}px)`,
                    },
                    vItem.index,
                  );
                })}
            </tbody>
          ) : (
            <tbody>
              {sortedObjects.map((item, idx) =>
                renderRow(item, undefined, idx),
              )}

              {objects.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]"
                  >
                    {t('bucket.empty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          )}
        </table>
      </div>
    </ResourceContextMenu>
  );
}
