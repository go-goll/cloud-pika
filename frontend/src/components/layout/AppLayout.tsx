import { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Header } from './Header';
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { TransferPanel } from '@/components/transfers/TransferPanel';

/** 窄窗口折叠阈值（与 Sidebar 保持一致） */
const COLLAPSE_WIDTH = 900;

/**
 * 主布局：左侧固定 Sidebar + 右侧（顶部 Header + 内容区）
 */
export function AppLayout({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(
    window.innerWidth < COLLAPSE_WIDTH,
  );

  useEffect(() => {
    const onResize = () => {
      setCollapsed(window.innerWidth < COLLAPSE_WIDTH);
    };
    window.addEventListener('resize', onResize);
    return () =>
      window.removeEventListener('resize', onResize);
  }, []);

  const sidebarWidth = collapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_WIDTH;

  return (
    <div className="flex min-h-screen bg-[var(--bg)] transition-colors duration-300">
      <Sidebar />
      <div
        className="flex flex-1 flex-col transition-[margin-left] duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <Header />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
        <TransferPanel />
      </div>
    </div>
  );
}
