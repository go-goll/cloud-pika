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
import {
  ArrowDown,
  ArrowUp,
  File,
  Folder,
  MoreHorizontal,
} from 'lucide-react';
import type { ObjectItem } from '@/types/cloud';
import {
  extractFileName,
  formatFileSize,
  formatRelativeTime,
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
  onNavigateFolder?: (prefix: string) => void;
  onUpload?: () => void;
  onRefresh?: () => void;
}

/** 行操作下拉菜单 */
function RowActionMenu({
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
  danger,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center px-3 py-1.5 text-sm',
        'rounded-lg transition-colors',
        'hover:bg-surface-container-low',
        danger ? 'text-danger' : '',
      ].join(' ')}
    >
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
  onNavigateFolder,
  onUpload,
  onRefresh,
}: ResourceTableProps) {
  const { t } = useTranslation();
  const [sortCol, setSortCol] =
    useState<SortColumn | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

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

  const allSelected =
    objects.length > 0 &&
    objects.every((o) => selectedKeys.has(o.key));

  const thClass = [
    'px-6 py-4 cursor-pointer select-none',
    'hover:text-on-surface transition-colors',
  ].join(' ');

  return (
    <ResourceContextMenu
      blankActions={
        onUpload && onRefresh
          ? { onUpload, onRefresh }
          : undefined
      }
    >
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden ghost-border shadow-sm">
        <table className="w-full text-left border-collapse">
          {/* 表头 */}
          <thead>
            <tr className="bg-surface-container-low/50 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 border-b border-outline-variant">
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
              <th className="px-6 py-4">MIME</th>
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

          {/* 表体 */}
          <tbody className="divide-y divide-outline-variant">
            {sortedObjects.map((item) => {
              const isSelected = selectedKeys.has(
                item.key,
              );
              const isDir =
                item.isDir || item.key.endsWith('/');
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
                      'group transition-all cursor-default',
                      isSelected
                        ? 'bg-primary/5'
                        : 'hover:bg-surface-container-low',
                    ].join(' ')}
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

                    {/* MIME */}
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
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
        </table>
      </div>
    </ResourceContextMenu>
  );
}
