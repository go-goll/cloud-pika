import { useTranslation } from 'react-i18next';
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="flex flex-col items-center text-center">
        {/* Logo */}
        <div className="rounded-2xl bg-[var(--bg-card)] shadow-md p-3">
          <img
            src="/images/logo.svg"
            alt="Cloud Pika"
            className="h-16 w-16"
          />
        </div>

        {/* 品牌名称 */}
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)]">
          Cloud Pika
        </h1>
        <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[var(--text-secondary)]">
          {t('bootstrap.subtitle', 'PREMIUM STORAGE SOLUTION')}
        </p>

        {/* 错误状态 */}
        {error ? (
          <div className="mt-8 flex w-64 flex-col items-center">
            <AlertCircle size={32} className="text-[var(--danger)]" />
            <h2 className="mt-3 text-sm font-semibold text-[var(--text)]">
              {t('bootstrap.failure', 'Bootstrap Failure')}
            </h2>
            <div className="mt-3 w-full rounded-xl bg-[var(--bg-raised)] p-4">
              <p className="font-mono text-xs text-[var(--text-secondary)] break-all">
                {error}
              </p>
            </div>
            <button
              onClick={onRetry}
              className="mt-4 w-full gradient-primary rounded-xl py-2.5 text-sm font-medium text-white"
            >
              {t('bootstrap.retry', 'Retry')}
            </button>
          </div>
        ) : null}

        {/* 加载状态 */}
        {loading && !error ? (
          <div className="mt-8 w-64">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-raised)]">
              <div className="h-full rounded-full bg-[var(--accent)] progress-shimmer" />
            </div>
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              {t('bootstrap.loading')}
            </p>
          </div>
        ) : null}
      </div>

      {/* 底部版本号 */}
      <p className="fixed bottom-6 text-[10px] text-[var(--text-secondary)]">
        v0.1.0
      </p>
    </div>
  );
}
