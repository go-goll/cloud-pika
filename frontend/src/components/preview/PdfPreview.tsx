/**
 * PdfPreview - PDF 文件预览
 * 使用 iframe 嵌入 PDF（利用浏览器/WebView 内置 PDF 渲染器）
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface PdfPreviewProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
}

export function PdfPreview({
  open,
  onClose,
  pdfUrl,
  fileName,
}: PdfPreviewProps) {
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

      {/* PDF 内嵌查看器 */}
      <div
        className="w-[90vw] h-[90vh] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={pdfUrl}
          title={fileName}
          className="h-full w-full rounded-2xl bg-white"
        />
      </div>

      {/* 文件名 */}
      <p
        className="mt-3 rounded-full px-5 py-2 bg-white/10 backdrop-blur-md text-sm text-white/80 max-w-[80vw] truncate"
        title={fileName}
        onClick={(e) => e.stopPropagation()}
      >
        {fileName}
      </p>
    </div>,
    document.body,
  );
}
