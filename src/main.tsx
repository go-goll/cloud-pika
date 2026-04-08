import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import '@/i18n/i18n';
import { useSidecarBootstrap } from '@/hooks/useSidecarBootstrap';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useSSE } from '@/hooks/useSSE';
import { BootstrapScreen } from '@/components/BootstrapScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/Toaster';
import { TooltipProvider } from '@/components/ui/Tooltip';

const queryClient = new QueryClient();

/** 启动引导组件：加载 sidecar 并显示品牌化启动画面 */
function Bootstrap() {
  const { loading, error } = useSidecarBootstrap();
  useThemeSync();
  useSSE();

  if (loading || error) {
    return (
      <BootstrapScreen
        loading={loading}
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return <App />;
}

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Bootstrap />
          </BrowserRouter>
        </QueryClientProvider>
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
