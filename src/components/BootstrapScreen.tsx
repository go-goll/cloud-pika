import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Cloud } from 'lucide-react';

interface BootstrapScreenProps {
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string;
  /** 重试回调 */
  onRetry: () => void;
}

/** 品牌化启动画面，替代简陋的加载文本 */
export function BootstrapScreen({
  loading,
  error,
  onRetry,
}: BootstrapScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        {/* 品牌图标 + 名称 */}
        <div className="flex items-center gap-3">
          <Cloud
            size={36}
            className="text-primary"
            strokeWidth={2}
          />
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
            Cloud Pika
          </h1>
        </div>

        {/* 副标题 */}
        <p className="text-sm text-on-surface-variant">
          {t('bootstrap.subtitle')}
        </p>

        {/* 错误状态 */}
        {error ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-danger">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
            <Button onClick={onRetry}>
              {t('bootstrap.retry')}
            </Button>
          </div>
        ) : null}

        {/* 加载状态 */}
        {loading && !error ? (
          <div className="flex flex-col items-center gap-4">
            {/* 脉冲进度条 */}
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-surface-container-low">
              <div
                className="h-full signature-gradient rounded-full"
                style={{
                  width: '60%',
                  animation:
                    'bootstrap-slide 1.5s ease-in-out infinite',
                }}
              />
            </div>
            <p className="text-xs text-on-surface-variant">
              {t('bootstrap.loading')}
            </p>
          </div>
        ) : null}
      </div>

      {/* 进度条滑动动画 */}
      <style>{`
        @keyframes bootstrap-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(80%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
