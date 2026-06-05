/**
 * AudioPreview - 音频预览播放器
 * 全屏暗色遮罩 + 原生 audio 播放器（通过签名 URL）
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Music, X } from 'lucide-react';

interface AudioPreviewProps {
  open: boolean;
  onClose: () => void;
  audioUrl: string;
  fileName: string;
}

export function AudioPreview({
  open,
  onClose,
  audioUrl,
  fileName,
}: AudioPreviewProps) {
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

      {/* 播放器区域 */}
      <div
        className="flex flex-col items-center gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 音乐图标 */}
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md">
          <Music size={48} className="text-white/60" />
        </div>

        {/* 文件名 */}
        <p
          className="max-w-[400px] truncate text-base text-white/80 font-medium"
          title={fileName}
        >
          {fileName}
        </p>

        {/* 播放器控件 */}
        <audio
          src={audioUrl}
          controls
          autoPlay
          className="w-[360px]"
        >
          <track kind="captions" />
        </audio>
      </div>
    </div>,
    document.body,
  );
}
