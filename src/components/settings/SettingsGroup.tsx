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
      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
        {title}
      </h3>
      <div className="space-y-1 rounded-xl ghost-border p-1">
        {children}
      </div>
    </div>
  );
}
