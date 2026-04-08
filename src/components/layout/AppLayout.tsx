import type { PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/** 主布局：侧边栏 + 头部 + 内容区 */
export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
