/**
 * ImagePreview - 图片预览大图查看器
 * 全屏暗色遮罩 + 居中图片 + 缩放/旋转/重置
 * 支持左右箭头切换、鼠标滚轮缩放、键盘导航
 */
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

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

const toolBtnClass = [
  'flex h-9 w-9 items-center justify-center',
  'rounded-full text-white/80 hover:text-white',
  'hover:bg-white/15 transition-all duration-150',
].join(' ');

/** 缩放步长 */
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5;

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
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // 图片切换或关闭时重置状态
  useEffect(() => {
    setScale(1);
    setRotation(0);
  }, [imageUrl, open]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + ZOOM_STEP, ZOOM_MAX));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - ZOOM_STEP, ZOOM_MIN));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
  }, []);

  const rotate = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  // 键盘和滚轮事件
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowLeft': onPrev?.(); break;
        case 'ArrowRight': onNext?.(); break;
        case '+':
        case '=': zoomIn(); break;
        case '-': zoomOut(); break;
        case '0': resetView(); break;
        case 'r': rotate(); break;
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [open, onPrev, onNext, onClose, zoomIn, zoomOut, resetView, rotate]);

  if (!open) return null;

  const zoomPercent = Math.round(scale * 100);

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
          className="max-w-[85vw] max-h-[80vh] rounded-2xl object-contain shadow-2xl transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />

        {onNext ? (
          <button type="button" onClick={onNext} className={`${navBtnClass} -right-2`}>
            <ChevronRight size={28} />
          </button>
        ) : null}
      </div>

      {/* 底部工具栏 */}
      <div
        className="mt-4 flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={zoomOut} className={toolBtnClass} title="Zoom out (-)">
          <ZoomOut size={16} />
        </button>
        <span className="min-w-[3rem] text-center text-xs text-white/70">
          {zoomPercent}%
        </span>
        <button type="button" onClick={zoomIn} className={toolBtnClass} title="Zoom in (+)">
          <ZoomIn size={16} />
        </button>
        <div className="mx-1 h-4 w-px bg-white/20" />
        <button type="button" onClick={rotate} className={toolBtnClass} title="Rotate (R)">
          <RotateCw size={16} />
        </button>
        <button type="button" onClick={resetView} className={toolBtnClass} title="Reset (0)">
          <Maximize2 size={16} />
        </button>
        <div className="mx-1 h-4 w-px bg-white/20" />
        <span
          className="max-w-[200px] truncate text-xs text-white/60 px-1"
          title={fileName}
        >
          {currentIndex !== undefined && totalCount
            ? `${currentIndex} / ${totalCount} — `
            : ''}
          {fileName}
        </span>
      </div>
    </div>,
    document.body,
  );
}
