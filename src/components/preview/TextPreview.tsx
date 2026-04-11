/**
 * TextPreview - 文本/代码/Markdown 预览组件
 * 全屏暗色遮罩，支持语法高亮和 Markdown 渲染
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { codeToHtml } from 'shiki';
import type { PreviewType } from '@/lib/preview-type';

interface TextPreviewProps {
  open: boolean;
  onClose: () => void;
  contentUrl: string;
  fileName: string;
  previewType: Exclude<PreviewType, 'image'>;
  lang?: string;
}

export function TextPreview({
  open,
  onClose,
  contentUrl,
  fileName,
  previewType,
  lang,
}: TextPreviewProps) {
  const [content, setContent] = useState('');
  const [highlighted, setHighlighted] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setContent('');
    setHighlighted('');
    setError('');

    let cancelled = false;
    fetch(contentUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(async (text) => {
        if (cancelled) return;
        setContent(text);
        if (previewType === 'code' && lang) {
          // shiki codeToHtml 内部已对代码内容做 HTML 转义，此处 XSS 风险可控
          const html = await codeToHtml(text, {
            lang,
            theme: 'github-dark',
          });
          if (!cancelled) setHighlighted(html);
        }
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load file');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [open, contentUrl, previewType, lang]);

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

      {/* 内容区域 */}
      <div
        className="relative w-[85vw] max-h-[80vh] overflow-auto rounded-2xl bg-[#1e1e2e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div
            data-testid="text-preview-loading"
            className="flex items-center justify-center h-64"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <div className="p-6">
            {previewType === 'markdown' ? (
              <div className="prose prose-invert max-w-none">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {content}
                </Markdown>
              </div>
            ) : previewType === 'code' && highlighted ? (
              <div
                className="text-sm leading-relaxed [&_pre]:!bg-transparent [&_pre]:!p-0"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            ) : (
              <pre className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap break-words font-mono">
                {content}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* 底部文件名 pill */}
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
