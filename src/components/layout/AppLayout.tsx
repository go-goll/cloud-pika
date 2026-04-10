import type { PropsWithChildren } from 'react';
import { Header } from './Header';
import { TransferPanel } from '@/components/transfers/TransferPanel';

/**
 * 主布局：顶部导航栏 + 内容区
 * 导航已合并到 Header，无需独立侧边栏
 */
export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div
      className={[
        'flex min-h-screen flex-col',
        'bg-[var(--color-surface)]',
        'transition-colors duration-300',
      ].join(' ')}
    >
      <Header />
      <main className="flex-1 overflow-hidden p-4 sm:p-6">
        {children}
      </main>
      <TransferPanel />
    </div>
  );
}
