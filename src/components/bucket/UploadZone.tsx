/**
 * UploadZone - 拖拽上传遮罩组件
 * 正常状态不可见，拖拽文件进入时显示半透明遮罩和上传提示
 */
import { useTranslation } from 'react-i18next';
import { UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  isDragActive: boolean;
}

export function UploadZone({ isDragActive }: UploadZoneProps) {
  const { t } = useTranslation();

  if (!isDragActive) return null;

  return (
    <div
      className={[
        'fixed inset-0 z-40',
        'flex items-center justify-center',
        'bg-[color-mix(in_srgb,var(--surface)_85%,transparent)]',
        'backdrop-blur-md',
        'transition-opacity duration-200',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={[
            'flex h-20 w-20 items-center justify-center',
            'rounded-full',
            'bg-[color-mix(in_srgb,var(--primary)_15%,transparent)]',
          ].join(' ')}
        >
          <UploadCloud
            size={36}
            className="text-[var(--primary)]"
          />
        </div>
        <p className="text-sm font-medium text-[var(--text)]">
          {t('bucket.dragUploadHint')}
        </p>
      </div>
    </div>
  );
}
