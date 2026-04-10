/**
 * ImagePreview - 图片预览大图查看器
 * 全屏暗色遮罩 + 居中图片 + 平滑缩放入场
 * 支持左右箭头切换和键盘导航
 *
 * Cirrus Ether 设计系统：
 * - 遮罩 bg-black/80
 * - 导航按钮 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm
 * - 底部控制栏 rounded-full bg-white/10 backdrop-blur-md
 * - 图片 rounded-2xl shadow-2xl
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImagePreviewProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
  onPrev?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

const navBtnClass = [
  'absolute top-1/2 -translate-y-1/2',
  'flex h-12 w-12 items-center justify-center',
  'rounded-full bg-white/10 backdrop-blur-sm text-white',
  'hover:bg-white/20 transition-all duration-200 active:scale-90',
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

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onPrev, onNext, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
      >
        <X size={20} />
      </button>

      {/* 图片区域 */}
      <div
        className="relative flex items-center justify-center px-20"
        onClick={(e) => e.stopPropagation()}
      >
        {onPrev ? (
          <button type="button" onClick={onPrev} className={`${navBtnClass} -left-2`}>
            <ChevronLeft size={28} />
          </button>
        ) : null}

        <img
          src={imageUrl}
          alt={fileName}
          className="max-w-[85vw] max-h-[80vh] rounded-2xl object-contain shadow-2xl"
        />

        {onNext ? (
          <button type="button" onClick={onNext} className={`${navBtnClass} -right-2`}>
            <ChevronRight size={28} />
          </button>
        ) : null}
      </div>

      {/* 底部信息 pill */}
      <p
        className="mt-4 rounded-full px-5 py-2.5 bg-white/10 backdrop-blur-md text-sm text-white/80 max-w-[80vw] truncate"
        title={fileName}
        onClick={(e) => e.stopPropagation()}
      >
        {currentIndex !== undefined && totalCount
          ? `${currentIndex} / ${totalCount} — `
          : ''}
        {fileName}
      </p>
    </div>,
    document.body,
  );
}
