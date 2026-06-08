import { useEffect, useState } from 'react';
import type { CSSProperties, PropsWithChildren } from 'react';
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { AppTitlebar } from './AppTitlebar';
import { AppInspector } from './AppInspector';
import { MetricsBar } from './MetricsBar';

/** 窄窗口折叠阈值（与 Sidebar 保持一致） */
const COLLAPSE_WIDTH = 900;

/** 主布局：标题栏 + Sidebar + 中央工作区 + Inspector */
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
    <div
      className="app-shell grid h-full overflow-hidden bg-[var(--bg)] text-[var(--text)] transition-colors duration-300"
      style={
        {
          '--sidebar-width': `${sidebarWidth}px`,
          '--titlebar-height': '48px',
          gridTemplateRows: 'var(--titlebar-height) minmax(0, 1fr)',
        } as CSSProperties
      }
    >
      <AppTitlebar />
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <main className="min-h-0 overflow-auto p-3 sm:p-4">
        <div className="mx-auto flex min-h-full max-w-[1440px] flex-col gap-3">
          <MetricsBar />
          {children}
        </div>
      </main>
      <AppInspector />
    </div>
  );
}
