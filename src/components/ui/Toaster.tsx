import { Toaster as SonnerToaster } from 'sonner';

/**
 * 全局 Toast 通知容器
 * 位于右下角，最多堆叠3条通知
 * 主题自动跟随应用的 data-theme 属性
 */
export function Toaster() {
  const isDark =
    document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <SonnerToaster
      position="bottom-right"
      visibleToasts={3}
      theme={isDark ? 'dark' : 'light'}
      toastOptions={{
        style: {
          background: 'var(--surface-high)',
          color: 'var(--text)',
          border: '1px solid var(--outline)',
          borderRadius: 'var(--radius)',
        },
      }}
    />
  );
}
