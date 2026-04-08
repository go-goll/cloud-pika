/**
 * ResourceTable - 文件资源表格视图组件
 * 支持Checkbox多选、列排序、行操作菜单、文件夹双击进入
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
  onUpload?: () => void;
  onRefresh?: () => void;
}

/** 启用虚拟滚动的阈值 */
const VIRTUAL_THRESHOLD = 100;

/** 虚拟滚动行高估计值 */
const ROW_HEIGHT = 52;

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
          'flex h-7 w-7 items-center justify-center',
          'rounded-lg transition-colors',
          'hover:bg-surface-container-low',
          'text-on-surface-variant',
          'opacity-0 group-hover:opacity-100',
        ].join(' ')}
      >
        <MoreHorizontal size={15} />
      </button>

      {open ? (
        <div
          className={[
            'absolute right-0 top-8 z-30',
            'min-w-[160px] rounded-xl p-1.5',
            'bg-surface-container-lowest',
            'ghost-border shadow-ambient',
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
          <div className="my-1 h-px bg-outline-variant" />
          <ActionItem
            label={t('bucket.delete')}
            danger
            onClick={() => {
              onDelete?.(objectKey);
              setOpen(false);
            }}
          />
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
<<<<<<< HEAD
        'flex w-full items-center px-3 py-1.5 text-sm',
        'rounded-lg transition-colors',
        'hover:bg-surface-container-low',
        danger ? 'text-danger' : '',
=======
        'flex w-full items-center gap-2 px-3 py-1.5 text-sm',
        'rounded-[var(--radius)] transition-colors',
        'hover:bg-[var(--surface-elevated)]',
        danger ? 'text-[var(--danger)]' : '',
>>>>>>> worktree-agent-a58030ba
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
  onUpload,
  onRefresh,
}: ResourceTableProps) {
<<<<<<< HEAD
<<<<<<< HEAD
  const { t } = useTranslation();
  const [sortCol, setSortCol] =
    useState<SortColumn | null>(null);
=======
  const { t, i18n } = useTranslation();
  const [sortCol, setSortCol] = useState<SortColumn | null>(
    null,
  );
>>>>>>> worktree-agent-a58030ba
=======
  const { t } = useTranslation();
  const [sortCol, setSortCol] = useState<SortColumn | null>(null);
>>>>>>> worktree-agent-ae7d276e
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
  const useVirtual = sortedObjects.length > VIRTUAL_THRESHOLD;

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
    'px-6 py-4 cursor-pointer select-none',
    'hover:text-on-surface transition-colors',
  ].join(' ');

  /** 渲染单行 */
  const renderRow = (
    item: ObjectItem,
    style?: React.CSSProperties,
  ) => {
    const isSelected = selectedKeys.has(item.key);
    const isDir = item.isDir || item.key.endsWith('/');
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
          onPreview: itemIsImage && !isDir
            ? () => onPreview?.(item.key)
            : undefined,
        }}
      >
        <tr
          style={style}
          className={[
            'rounded-[var(--radius)] transition-colors',
            'cursor-default',
            isSelected
              ? 'bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface-high))]'
              : 'bg-[var(--surface-high)] hover:bg-[var(--surface-elevated)]',
          ].join(' ')}
          onDoubleClick={() => {
            if (isDir) onNavigateFolder?.(item.key);
          }}
        >
          {/* Checkbox */}
          <td className="rounded-l-[var(--radius)] px-3 py-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                onSelect(
                  item.key,
                  (e.nativeEvent as MouseEvent).shiftKey,
                );
              }}
              className="cursor-pointer accent-[var(--primary)]"
            />
          </td>

          {/* 文件名 */}
          <td className="px-3 py-2.5">
            <div className="flex items-center gap-2">
              {isDir ? (
                <Folder
                  size={15}
                  className="shrink-0 text-[var(--primary)]"
                />
              ) : (
                <File
                  size={15}
                  className="shrink-0 text-[var(--text-muted)]"
                />
              )}
              <span
                className={[
                  'truncate',
                  isDir
                    ? 'font-medium text-[var(--primary)]'
                    : '',
                ].join(' ')}
                title={item.key}
              >
                {fileName}
              </span>
            </div>
          </td>

          {/* 大小 */}
          <td className="px-3 py-2.5 text-[var(--text-muted)]">
            {isDir ? '-' : formatFileSize(item.size)}
          </td>

          {/* MIME */}
          <td className="px-3 py-2.5 text-[var(--text-muted)]">
            {item.mimeType ?? '-'}
          </td>

          {/* 更新时间 */}
          <td className="px-3 py-2.5 text-[var(--text-muted)]">
            {item.lastModified
              ? formatRelativeTime(item.lastModified)
              : '-'}
          </td>

          {/* 操作 */}
          <td className="rounded-r-[var(--radius)] px-3 py-2.5">
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
          ? { onUpload, onRefresh }
          : undefined
      }
    >
<<<<<<< HEAD
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden ghost-border shadow-sm">
        <table className="w-full text-left border-collapse">
          {/* 表头 */}
          <thead>
            <tr className="bg-surface-container-low/50 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 border-b border-outline-variant">
=======
      <div
        ref={scrollRef}
        className={[
          'rounded-[var(--radius)]',
          'bg-[var(--surface-low)] p-3',
          useVirtual ? 'max-h-[70vh] overflow-auto' : '',
        ].join(' ')}
      >
        <table className="w-full border-separate border-spacing-y-1 text-sm">
          <thead className="text-left text-xs text-[var(--text-muted)]">
            <tr>
>>>>>>> worktree-agent-a58030ba
              {/* 全选Checkbox */}
              <th className="w-12 px-6 py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="cursor-pointer accent-primary"
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
<<<<<<< HEAD
              <th className="px-6 py-4">MIME</th>
=======
              <th className="hidden px-3 lg:table-cell">
                MIME
              </th>
>>>>>>> worktree-agent-ae7d276e
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
              <th className="w-16 px-6 py-4" />
            </tr>
          </thead>
<<<<<<< HEAD
<<<<<<< HEAD

          {/* 表体 */}
          <tbody className="divide-y divide-outline-variant">
            {sortedObjects.map((item) => {
              const isSelected = selectedKeys.has(
                item.key,
              );
              const isDir =
                item.isDir || item.key.endsWith('/');
=======
          <tbody>
            {sortedObjects.map((item, index) => {
              const isSelected = selectedKeys.has(item.key);
              const isDir = item.isDir || item.key.endsWith('/');
>>>>>>> worktree-agent-ae7d276e
              const fileName = extractFileName(item.key);

              return (
                <ResourceContextMenu
                  key={item.key}
                  fileActions={{
                    onCopyUrl: () =>
                      onCopyUrl?.(item.key),
                    onDownload: () =>
                      onDownload?.(item.key),
                    onRename: () =>
                      onRename?.(item.key),
                    onDelete: () =>
                      onDelete?.(item.key),
                  }}
                >
                  <tr
                    className={[
<<<<<<< HEAD
                      'group transition-all cursor-default',
=======
                      'animate-row-in',
                      'rounded-[var(--radius)] transition-colors',
                      'cursor-default',
>>>>>>> worktree-agent-ae7d276e
                      isSelected
                        ? 'bg-primary/5'
                        : 'hover:bg-surface-container-low',
                    ].join(' ')}
                    style={{
                      animationDelay: `${index * 20}ms`,
                    }}
                    onDoubleClick={() => {
                      if (isDir)
                        onNavigateFolder?.(item.key);
                    }}
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-4">
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
                        className="cursor-pointer accent-primary"
                      />
                    </td>

                    {/* 文件名 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {isDir ? (
                          <Folder
                            size={20}
                            className="shrink-0 text-primary"
                          />
                        ) : (
                          <File
                            size={20}
                            className="shrink-0 text-on-surface-variant"
                          />
                        )}
                        <span
                          className={[
                            'truncate font-medium',
                            isDir
                              ? 'text-primary'
                              : 'text-on-surface',
                          ].join(' ')}
                          title={item.key}
                        >
                          {fileName}
                        </span>
                      </div>
                    </td>

                    {/* 大小 */}
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {isDir
                        ? '-'
                        : formatFileSize(item.size)}
                    </td>

<<<<<<< HEAD
                    {/* MIME */}
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
=======
                    {/* MIME（窄窗口隐藏） */}
                    <td
                      className={
                        'hidden px-3 py-2.5 '
                        + 'text-[var(--text-muted)] '
                        + 'lg:table-cell'
                      }
                    >
>>>>>>> worktree-agent-ae7d276e
                      {item.mimeType ?? '-'}
                    </td>

                    {/* 更新时间 */}
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {item.lastModified
                        ? formatRelativeTime(
                            item.lastModified,
                          )
                        : '-'}
                    </td>

                    {/* 操作 */}
                    <td className="px-6 py-4 text-right">
                      <RowActionMenu
                        objectKey={item.key}
                        onCopyUrl={onCopyUrl}
                        onDownload={onDownload}
                        onRename={onRename}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                </ResourceContextMenu>
              );
            })}

            {objects.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-on-surface-variant"
                >
                  {t('bucket.empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
=======

          {/* 虚拟滚动模式 */}
          {useVirtual ? (
            <tbody
              style={{
                height: virtualizer.getTotalSize(),
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((vItem) => {
                const item = sortedObjects[vItem.index];
                return renderRow(item, {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${vItem.size}px`,
                  transform: `translateY(${vItem.start}px)`,
                });
              })}
            </tbody>
          ) : (
            <tbody>
              {sortedObjects.map((item) => renderRow(item))}

              {objects.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-[var(--text-muted)]"
                  >
                    {t('bucket.empty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          )}
>>>>>>> worktree-agent-a58030ba
        </table>
      </div>
    </ResourceContextMenu>
  );
}
