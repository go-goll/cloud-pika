import type { PropsWithChildren } from 'react';

interface SettingsGroupProps {
  title: string;
}

/** 设置分组容器，带标题和分隔线 */
export function SettingsGroup({
  title,
  children,
}: PropsWithChildren<SettingsGroupProps>) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        {title}
      </h3>
      <div
        className={[
          'space-y-1 rounded-[var(--radius)]',
          'bg-[var(--surface-low)] p-1',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
