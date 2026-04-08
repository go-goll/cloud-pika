import type { PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * 主布局：侧边栏（flex shrink-0） + 头部 + 内容区
 * 侧边栏通过 flex 布局自然占位，无需 fixed 定位
 */
export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div
      className={[
        'flex min-h-screen',
        'bg-[var(--color-surface)]',
        'transition-colors duration-300',
      ].join(' ')}
    >
      <Sidebar />

      {/* 主内容区 */}
      <div className="flex min-h-screen flex-1 flex-col overflow-auto">
        <Header />
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
