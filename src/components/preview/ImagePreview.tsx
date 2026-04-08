/**
 * ImagePreview - 图片预览大图查看器
 * 基于 Dialog 组件实现全屏半透明遮罩 + 居中图片展示
 */
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/Dialog';

interface ImagePreviewProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 图片签名URL */
  imageUrl: string;
  /** 文件名（展示在底部） */
  fileName: string;
}

export function ImagePreview({
  open,
  onClose,
  imageUrl,
  fileName,
}: ImagePreviewProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={[
          'max-w-[90vw] max-h-[90vh] w-auto p-0',
          'bg-transparent shadow-none border-none',
          'flex flex-col items-center gap-3',
        ].join(' ')}
      >
        {/* 图片区域 */}
        <img
          src={imageUrl}
          alt={fileName}
          className={[
            'max-w-[85vw] max-h-[75vh]',
            'rounded-[var(--radius)]',
            'object-contain',
            'shadow-ambient',
          ].join(' ')}
        />

        {/* 底部文件名 */}
        <p
          className={[
            'rounded-[var(--radius)] px-4 py-2',
            'bg-[var(--surface-high)]/80 backdrop-blur-sm',
            'text-sm text-[var(--text-muted)]',
            'max-w-[80vw] truncate',
          ].join(' ')}
          title={fileName}
        >
          {fileName}
        </p>

        {/*
          Dialog 组件自带右上角关闭按钮，
          此处无需额外渲染
        */}
      </DialogContent>
    </Dialog>
  );
}
