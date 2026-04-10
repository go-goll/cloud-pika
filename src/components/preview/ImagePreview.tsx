/**
 * ImagePreview - 图片预览大图查看器
 * 全屏模糊遮罩 + 居中图片 + 平滑缩放入场
 * 支持左右箭头切换和键盘导航
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
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
  /** 切换到上一张 */
  onPrev?: () => void;
  /** 切换到下一张 */
  onNext?: () => void;
  /** 当前图片序号（从1开始） */
  currentIndex?: number;
  /** 图片总数 */
  totalCount?: number;
}

/** 导航按钮样式 */
const navBtnClass = [
  'absolute top-1/2 -translate-y-1/2',
  'flex h-10 w-10 items-center justify-center',
  'rounded-full',
  'bg-black/30 backdrop-blur-sm',
  'text-white/90',
  'hover:bg-black/50 hover:text-white',
  'transition-all duration-200',
  'active:scale-90',
].join(' ');

export function ImagePreview({
  open,
  onClose,
  imageUrl,
  fileName,
  onPrev,
  onNext,
  currentIndex,
  totalCount,
}: ImagePreviewProps) {
  const { t } = useTranslation();

  // 键盘左右箭头切换
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', handler);
    return () =>
      window.removeEventListener('keydown', handler);
  }, [open, onPrev, onNext]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
    >
      <DialogContent
        className={[
          'max-w-[90vw] max-h-[90vh] w-auto p-0',
          'bg-transparent shadow-none border-none',
          'flex flex-col items-center gap-3',
        ].join(' ')}
      >
        <DialogTitle className="sr-only">
          {t('bucket.preview')}: {fileName}
        </DialogTitle>

        {/* 图片区域 */}
        <div
          className={[
            'relative flex items-center',
            'justify-center',
          ].join(' ')}
        >
          {onPrev ? (
            <button
              type="button"
              onClick={onPrev}
              className={`${navBtnClass} left-4`}
            >
              <ChevronLeft size={24} />
            </button>
          ) : null}

          <img
            src={imageUrl}
            alt={fileName}
            className={[
              'max-w-[85vw] max-h-[75vh]',
              'rounded-lg object-contain',
              'shadow-[var(--shadow-xl)]',
            ].join(' ')}
          />

          {onNext ? (
            <button
              type="button"
              onClick={onNext}
              className={`${navBtnClass} right-4`}
            >
              <ChevronRight size={24} />
            </button>
          ) : null}
        </div>

        {/* 底部文件名 + 计数 */}
        <p
          className={[
            'rounded-lg px-4 py-2',
            'glass-panel',
            'text-sm text-[var(--text-secondary)]',
            'max-w-[80vw] truncate',
          ].join(' ')}
          title={fileName}
        >
          {currentIndex !== undefined && totalCount
            ? `${currentIndex} / ${totalCount} — `
            : ''}
          {fileName}
        </p>
      </DialogContent>
    </Dialog>
  );
}
