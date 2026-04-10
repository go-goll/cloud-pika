import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

interface BootstrapScreenProps {
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string;
  /** 重试回调 */
  onRetry: () => void;
}

/** 品牌化启动画面，展示 Logo 和优雅的加载指示器 */
export function BootstrapScreen({
  loading,
  error,
  onRetry,
}: BootstrapScreenProps) {
  const { t } = useTranslation();

  return (
    <div
      className={[
        'flex min-h-screen items-center justify-center',
        'bg-[var(--bg)] relative overflow-hidden',
      ].join(' ')}
    >
      {/* 背景装饰光效 */}
      <div
        className={[
          'absolute top-1/4 left-1/2',
          '-translate-x-1/2 -translate-y-1/2',
          'w-[600px] h-[600px] rounded-full',
          'bg-[var(--accent)]/5 blur-[100px]',
          'animate-breathe',
        ].join(' ')}
      />
      <div
        className={[
          'absolute bottom-1/4 right-1/4',
          'w-[300px] h-[300px] rounded-full',
          'bg-[var(--accent)]/3 blur-[80px]',
          'animate-breathe',
        ].join(' ')}
        style={{ animationDelay: '1s' }}
      />

      <div
        className={[
          'flex flex-col items-center gap-8',
          'px-6 text-center relative z-10',
          'animate-fade-in',
        ].join(' ')}
      >
        {/* 品牌 Logo + 名称 */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/images/logo.png"
            alt="Cloud Pika"
            className="h-20 w-20 animate-float"
          />
          <div>
            <h1
              className={[
                'font-display text-3xl font-bold',
                'tracking-tight text-[var(--text)]',
              ].join(' ')}
            >
              Cloud Pika
            </h1>
            <p
              className={[
                'mt-2 text-sm',
                'text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {t('bootstrap.subtitle')}
            </p>
          </div>
        </div>

        {/* 错误状态 */}
        {error ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className={[
                'flex items-center gap-2',
                'text-[var(--danger)]',
              ].join(' ')}
            >
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
            {/* 渐变 shimmer 进度条 */}
            <div
              className={[
                'h-1 w-48 overflow-hidden rounded-full',
                'bg-[var(--bg-raised)]',
              ].join(' ')}
            >
              <div
                className={[
                  'h-full rounded-full',
                  'progress-shimmer',
                ].join(' ')}
                style={{ width: '60%' }}
              />
            </div>
            <p
              className={[
                'text-xs',
                'text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {t('bootstrap.loading')}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
