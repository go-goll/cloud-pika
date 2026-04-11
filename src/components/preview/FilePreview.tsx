/**
 * FilePreview - 文件预览统一分发器
 * 根据文件类型分发到 ImagePreview 或 TextPreview
 */
import { ImagePreview } from './ImagePreview';
import { TextPreview } from './TextPreview';
import { getPreviewType, getShikiLang } from '@/lib/preview-type';
import type { PreviewType } from '@/lib/preview-type';

interface FilePreviewProps {
  open: boolean;
  onClose: () => void;
  fileKey: string;
  contentUrl: string;
  /** 仅图片预览需要 */
  onPrev?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export function FilePreview({
  open,
  onClose,
  fileKey,
  contentUrl,
  onPrev,
  onNext,
  currentIndex,
  totalCount,
}: FilePreviewProps) {
  const fileName = fileKey.split('/').pop() ?? fileKey;
  const previewType: PreviewType | null = getPreviewType(fileKey);

  if (!open || !previewType) return null;

  if (previewType === 'image') {
    return (
      <ImagePreview
        open={open}
        onClose={onClose}
        imageUrl={contentUrl}
        fileName={fileName}
        onPrev={onPrev}
        onNext={onNext}
        currentIndex={currentIndex}
        totalCount={totalCount}
      />
    );
  }

  return (
    <TextPreview
      open={open}
      onClose={onClose}
      contentUrl={contentUrl}
      fileName={fileName}
      previewType={previewType}
      lang={previewType === 'code' ? getShikiLang(fileKey) : undefined}
    />
  );
}
