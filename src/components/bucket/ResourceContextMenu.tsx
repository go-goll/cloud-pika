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
  Link2,
  Pencil,
  RefreshCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react';

/** 菜单项样式 */
const itemClassName = [
  'flex items-center gap-2 px-3 py-2 text-sm',
  'cursor-pointer rounded-lg outline-none',
  'data-[highlighted]:bg-surface-container-low',
  'transition-colors',
].join(' ');

const dangerItemClassName = [
  itemClassName,
  'text-danger',
].join(' ');

const disabledItemClassName = [
  itemClassName,
  'opacity-40 pointer-events-none',
].join(' ');

const separatorClassName =
  'my-1 h-px bg-outline-variant';

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
}

/** 空白区域右键菜单的回调集合 */
interface BlankMenuActions {
  onUpload: () => void;
  onRefresh: () => void;
  /** 远程抓取回调（仅当 provider 支持时传入） */
  onFetchUrl?: () => void;
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
            'min-w-[180px] p-1.5 rounded-xl',
            'bg-surface-container-lowest',
            'ghost-border shadow-ambient z-50',
          ].join(' ')}
        >
          {fileActions ? (
            <>
              {/* 预览（仅图片文件显示） */}
              {fileActions.onPreview ? (
                <ContextMenu.Item
                  className={itemClassName}
                  onSelect={fileActions.onPreview}
                >
                  <Eye size={14} />
                  {t('bucket.preview')}
                </ContextMenu.Item>
              ) : null}

              {/* 文件操作菜单 */}
              <ContextMenu.Item
                className={itemClassName}
                onSelect={fileActions.onCopyUrl}
              >
                <Copy size={14} />
                {t('bucket.copyUrl')}
              </ContextMenu.Item>

              {fileActions.onRefreshCDN ? (
                <ContextMenu.Item
                  className={itemClassName}
                  onSelect={fileActions.onRefreshCDN}
                >
                  <RefreshCcw size={14} />
                  {t('bucket.refreshCDN')}
                </ContextMenu.Item>
              ) : null}

              <ContextMenu.Item
                className={itemClassName}
                onSelect={fileActions.onDownload}
              >
                <Download size={14} />
                {t('bucket.download')}
              </ContextMenu.Item>

              <ContextMenu.Item
                className={itemClassName}
                onSelect={fileActions.onRename}
              >
                <Pencil size={14} />
                {t('bucket.rename')}
              </ContextMenu.Item>

              {fileActions.onDelete ? (
                <>
                  <ContextMenu.Separator
                    className={separatorClassName}
                  />
                  <ContextMenu.Item
                    className={dangerItemClassName}
                    onSelect={fileActions.onDelete}
                  >
                    <Trash2 size={14} />
                    {t('bucket.delete')}
                  </ContextMenu.Item>
                </>
              ) : null}
            </>
          ) : null}

          {blankActions ? (
            <>
              {/* 空白区域菜单 */}
              <ContextMenu.Item
                className={itemClassName}
                onSelect={blankActions.onUpload}
              >
                <UploadCloud size={14} />
                {t('bucket.upload')}
              </ContextMenu.Item>

              {blankActions.onFetchUrl ? (
                <ContextMenu.Item
                  className={itemClassName}
                  onSelect={blankActions.onFetchUrl}
                >
                  <Link2 size={14} />
                  {t('bucket.fetchUrl')}
                </ContextMenu.Item>
              ) : null}

              <ContextMenu.Item
                className={disabledItemClassName}
                disabled
              >
                {t('bucket.newFolder')}
              </ContextMenu.Item>

              <ContextMenu.Separator
                className={separatorClassName}
              />

              <ContextMenu.Item
                className={itemClassName}
                onSelect={blankActions.onRefresh}
              >
                <RefreshCcw size={14} />
                {t('common.refresh')}
              </ContextMenu.Item>
            </>
          ) : null}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
