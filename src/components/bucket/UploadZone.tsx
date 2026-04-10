/**
 * UploadZone - 拖拽上传遮罩组件
 * 正常状态不可见，拖拽文件进入时显示品牌色脉冲边框和上传提示
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
        'fixed inset-0 z-40',
        'flex items-center justify-center',
        'bg-[var(--bg)]/80 backdrop-blur-md',
        'transition-all duration-200',
        'animate-fade-in',
      ].join(' ')}
    >
      {/* 脉冲边框容器 */}
      <div
        className={[
          'flex flex-col items-center gap-5 p-12',
          'rounded-2xl',
          'border-2 border-dashed',
          'border-[var(--accent)]',
          'bg-[var(--accent-soft)]',
          'animate-pulse-glow',
        ].join(' ')}
      >
        <div
          className={[
            'flex h-20 w-20 items-center',
            'justify-center rounded-full',
            'bg-[var(--accent)]/15',
          ].join(' ')}
        >
          <UploadCloud
            size={36}
            className="text-[var(--accent)] animate-float"
          />
        </div>
        <div className="text-center">
          <p
            className={[
              'text-base font-semibold',
              'text-[var(--text)]',
            ].join(' ')}
          >
            {t('bucket.dragUploadHint')}
          </p>
          <p
            className={[
              'mt-1 text-sm',
              'text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {t('bucket.upload')}
          </p>
        </div>
      </div>
    </div>
  );
}
