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
  Pencil,
  RefreshCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react';

/** 菜单项样式 */
const itemClassName = [
  'flex items-center gap-2 px-3 py-2 text-sm',
  'cursor-pointer rounded-[var(--radius)] outline-none',
  'data-[highlighted]:bg-[var(--surface-elevated)]',
  'transition-colors',
].join(' ');

const dangerItemClassName = [
  itemClassName,
  'text-[var(--danger)]',
].join(' ');

const disabledItemClassName = [
  itemClassName,
  'opacity-40 pointer-events-none',
].join(' ');

const separatorClassName =
  'my-1 h-px bg-[var(--outline)]';

/** 文件右键菜单的回调集合 */
interface FileMenuActions {
  onCopyUrl: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  /** 预览回调（仅图片文件可用） */
  onPreview?: () => void;
}

/** 空白区域右键菜单的回调集合 */
interface BlankMenuActions {
  onUpload: () => void;
  onRefresh: () => void;
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
            'min-w-[180px] p-1.5',
            'rounded-[calc(var(--radius)+2px)]',
            'bg-[var(--surface-high)]',
            'border border-[var(--outline)]',
            'shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
            'z-50',
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
