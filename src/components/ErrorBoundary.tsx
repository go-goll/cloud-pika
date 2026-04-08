import { Component } from 'react';
import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * React 错误边界组件
 * 捕获子组件树的渲染错误，显示友好的错误页面
 */
export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || '未知错误',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <ErrorFallback
      message={this.state.message}
      onRefresh={this.handleRefresh}
      onGoHome={this.handleGoHome}
    />;
  }
}

/**
 * 错误回退页面
 * 注意：由于类组件内无法使用 useTranslation，
 * 此处使用硬编码的中英文文本作为兜底
 */
function ErrorFallback({
  message,
  onRefresh,
  onGoHome,
}: {
  message: string;
  onRefresh: () => void;
  onGoHome: () => void;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--bg-pattern)' }}
    >
      <div className="flex max-w-md flex-col items-center gap-5 px-6 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'var(--surface-elevated)' }}
        >
          <AlertTriangle
            size={28}
            className="text-[var(--danger)]"
          />
        </div>

        <h2 className="font-display text-xl font-semibold text-[var(--text)]">
          出错了 / Something went wrong
        </h2>

        <p className="text-sm text-[var(--text-muted)]">
          {message}
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onRefresh}>
            <RefreshCcw size={16} className="mr-2" />
            刷新页面
          </Button>
          <Button onClick={onGoHome}>
            <Home size={16} className="mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}
