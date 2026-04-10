/**
 * UploadZone - 拖拽上传遮罩组件
 * 全屏毛玻璃遮罩 + 居中卡片 + 虚线边框
 */
import { useTranslation } from 'react-i18next';
import { UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  isDragActive: boolean;
}

export function UploadZone({
  isDragActive,
}: UploadZoneProps) {
  const { t } = useTranslation();

  if (!isDragActive) return null;

  return (
    <div
      className={[
        'fixed inset-0 z-50',
        'flex items-center justify-center',
        'backdrop-blur-md bg-[var(--bg)]/60',
        'animate-[fadeIn_0.2s_ease-out]',
      ].join(' ')}
    >
      {/* 居中卡片 */}
      <div
        className={[
          'rounded-2xl bg-[var(--bg-card)] shadow-xl',
          'p-8 text-center max-w-sm w-full mx-4',
          'border-2 border-dashed border-[var(--accent)]/30',
        ].join(' ')}
        style={{
          animation: 'fadeIn 0.2s ease-out, scaleUp 0.2s ease-out',
        }}
      >
        {/* 大文件图标 */}
        <UploadCloud
          className="text-[var(--accent)] w-16 h-16 mx-auto"
        />

        {/* 标题 */}
        <p className="text-lg font-semibold text-[var(--text)] mt-4">
          {t('bucket.dragUploadHint')}
        </p>

        {/* 副标题 */}
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          {t('bucket.upload')}
        </p>
      </div>
    </div>
  );
}
