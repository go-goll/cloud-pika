/**
 * VideoPreview - 视频预览播放器
 * 全屏暗色遮罩 + 原生 video 播放器（通过签名URL）
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface VideoPreviewProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  fileName: string;
}

export function VideoPreview({
  open,
  onClose,
  videoUrl,
  fileName,
}: VideoPreviewProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

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

      {/* 播放器 */}
      <div onClick={(e) => e.stopPropagation()}>
        <video
          src={videoUrl}
          controls
          autoPlay
          className="max-w-[85vw] max-h-[80vh] rounded-2xl shadow-2xl"
        >
          <track kind="captions" />
        </video>
      </div>

      {/* 文件名 */}
      <p
        className="mt-4 rounded-full px-5 py-2.5 bg-white/10 backdrop-blur-md text-sm text-white/80 max-w-[80vw] truncate"
        title={fileName}
        onClick={(e) => e.stopPropagation()}
      >
        {fileName}
      </p>
    </div>,
    document.body,
  );
}
