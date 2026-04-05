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

const queryClient = new QueryClient();

function Bootstrap() {
  const { loading, error } = useSidecarBootstrap();
  useThemeSync();
  useSSE();

  if (loading) {
    return <div className="p-8 text-sm">Bootstrapping sidecar...</div>;
  }

  if (error) {
    return <div className="p-8 text-sm text-red-500">{error}</div>;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Bootstrap />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
