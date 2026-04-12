import { Component } from 'react';
import type {
  ErrorInfo,
  PropsWithChildren,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Home,
  RefreshCcw,
} from 'lucide-react';
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

  static getDerivedStateFromError(
    error: Error,
  ): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || '',
    };
  }

  componentDidCatch(
    error: Error,
    info: ErrorInfo,
  ): void {
    console.error(
      '[ErrorBoundary]',
      error,
      info.componentStack,
    );
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

    return (
      <ErrorFallback
        message={this.state.message}
        onRefresh={this.handleRefresh}
        onGoHome={this.handleGoHome}
      />
    );
  }
}

/** 错误回退页面（函数组件，支持 i18n） */
function ErrorFallback({
  message,
  onRefresh,
  onGoHome,
}: {
  message: string;
  onRefresh: () => void;
  onGoHome: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex max-w-md flex-col items-center gap-5 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
          <AlertTriangle
            size={28}
            className="text-danger"
          />
        </div>

        <h2 className="font-headline text-xl font-semibold text-on-surface">
          {t('error.title')}
        </h2>

        <p className="text-sm text-on-surface-variant">
          {message || t('error.unknown')}
        </p>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onRefresh}
          >
            <RefreshCcw size={16} className="mr-2" />
            {t('error.refresh')}
          </Button>
          <Button onClick={onGoHome}>
            <Home size={16} className="mr-2" />
            {t('error.goHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}
