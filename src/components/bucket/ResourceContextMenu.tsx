/**
 * ResourceContextMenu - 右键上下文菜单组件
 * 基于 @radix-ui/react-context-menu 实现
 * 支持文件右键操作和空白区域右键操作
 */
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import * as ContextMenu from '@radix-ui/react-context-menu';
import {
  Copy,
  Download,
  Eye,
  FolderPlus,
  History,
  Link2,
  Pencil,
  RefreshCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react';

/** 菜单项样式 */
const itemClassName = [
  'flex items-center gap-3 px-4 py-2.5 text-sm',
  'cursor-pointer rounded-lg outline-none',
  'text-[var(--text)]',
  'hover:bg-[rgba(234,239,242,0.4)]',
  'data-[highlighted]:bg-[rgba(234,239,242,0.4)]',
  'transition-colors',
].join(' ');

const dangerItemClassName = [
  'flex items-center gap-3 px-4 py-2.5 text-sm',
  'cursor-pointer rounded-lg outline-none',
  'text-[var(--danger)]',
  'hover:bg-red-50 dark:hover:bg-red-950/30',
  'data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-950/30',
  'transition-colors',
].join(' ');

const separatorClassName =
  'border-t border-[var(--border)] my-1';

/** 文件右键菜单的回调集合 */
interface FileMenuActions {
  onCopyUrl: () => void;
  onDownload: () => void;
  onRename: () => void;
  /** 删除回调（hideDeleteButton 启用时不传） */
  onDelete?: () => void;
  /** 预览回调（仅图片文件可用） */
  onPreview?: () => void;
  /** CDN 刷新回调（仅启用 refreshCDN 功能时提供） */
  onRefreshCDN?: () => void;
  /** CDN 预热回调（仅启用 prefetchCDN 功能时提供） */
  onPrefetchCDN?: () => void;
  /** 版本历史回调（仅启用 versioning 功能时提供） */
  onVersionHistory?: () => void;
}

/** 空白区域右键菜单的回调集合 */
interface BlankMenuActions {
  onUpload: () => void;
  onRefresh: () => void;
  /** 远程抓取回调（仅当 provider 支持时传入） */
  onFetchUrl?: () => void;
  /** 新建文件夹回调 */
  onCreateFolder?: () => void;
}

interface ResourceContextMenuProps {
  /** 文件操作回调（当右键点击文件时提供） */
  fileActions?: FileMenuActions;
  /** 空白区域操作回调 */
  blankActions?: BlankMenuActions;
}

export function ResourceContextMenu({
  children,
  fileActions,
  blankActions,
}: PropsWithChildren<ResourceContextMenuProps>) {
  const { t } = useTranslation();

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className={[
            'min-w-[200px] p-1.5',
            'rounded-xl',
            'bg-[var(--bg-card)]',
            'border border-[var(--border)]',
            'shadow-lg z-50',
          ].join(' ')}
        >
          {fileActions ? (
            <>
              {fileActions.onPreview ? (
                <ContextMenu.Item
                  className={itemClassName}
                  onSelect={fileActions.onPreview}
                >
                  <Eye size={16} />
                  {t('bucket.preview')}
                </ContextMenu.Item>
              ) : null}

              <ContextMenu.Item
                className={itemClassName}
                onSelect={fileActions.onCopyUrl}
              >
                <Copy size={16} />
                {t('bucket.copyUrl')}
              </ContextMenu.Item>

              {fileActions.onRefreshCDN ? (
                <ContextMenu.Item
                  className={itemClassName}
                  onSelect={fileActions.onRefreshCDN}
                >
                  <RefreshCcw size={16} />
                  {t('bucket.refreshCDN')}
                </ContextMenu.Item>
              ) : null}

              {fileActions.onPrefetchCDN ? (
                <ContextMenu.Item
                  className={itemClassName}
                  onSelect={fileActions.onPrefetchCDN}
                >
                  <RefreshCcw size={16} />
                  {t('bucket.prefetchCDN')}
                </ContextMenu.Item>
              ) : null}

              <ContextMenu.Item
                className={itemClassName}
                onSelect={fileActions.onDownload}
              >
                <Download size={16} />
                {t('bucket.download')}
              </ContextMenu.Item>

              <ContextMenu.Item
                className={itemClassName}
                onSelect={fileActions.onRename}
              >
                <Pencil size={16} />
                {t('bucket.rename')}
              </ContextMenu.Item>

              {fileActions.onVersionHistory ? (
                <ContextMenu.Item
                  className={itemClassName}
                  onSelect={fileActions.onVersionHistory}
                >
                  <History size={16} />
                  {t('bucketSettings.versionHistory')}
                </ContextMenu.Item>
              ) : null}

              {fileActions.onDelete ? (
                <>
                  <ContextMenu.Separator
                    className={separatorClassName}
                  />
                  <ContextMenu.Item
                    className={dangerItemClassName}
                    onSelect={fileActions.onDelete}
                  >
                    <Trash2 size={16} />
                    {t('bucket.delete')}
                  </ContextMenu.Item>
                </>
              ) : null}
            </>
          ) : null}

          {blankActions ? (
            <>
              <ContextMenu.Item
                className={itemClassName}
                onSelect={blankActions.onUpload}
              >
                <UploadCloud size={16} />
                {t('bucket.upload')}
              </ContextMenu.Item>

              {blankActions.onFetchUrl ? (
                <ContextMenu.Item
                  className={itemClassName}
                  onSelect={blankActions.onFetchUrl}
                >
                  <Link2 size={16} />
                  {t('bucket.fetchUrl')}
                </ContextMenu.Item>
              ) : null}

              {blankActions.onCreateFolder ? (
                <ContextMenu.Item
                  className={itemClassName}
                  onSelect={blankActions.onCreateFolder}
                >
                  <FolderPlus size={16} />
                  {t('bucket.newFolder')}
                </ContextMenu.Item>
              ) : null}

              <ContextMenu.Separator
                className={separatorClassName}
              />

              <ContextMenu.Item
                className={itemClassName}
                onSelect={blankActions.onRefresh}
              >
                <RefreshCcw size={16} />
                {t('common.refresh')}
              </ContextMenu.Item>
            </>
          ) : null}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
