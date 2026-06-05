import type { PropsWithChildren, ReactNode } from 'react';

interface SettingsGroupProps {
  title: string;
  icon?: ReactNode;
}

/** 设置分组容器，带图标标题和卡片边框 */
export function SettingsGroup({
  title,
  icon,
  children,
}: PropsWithChildren<SettingsGroupProps>) {
  return (
    <div
      className={[
        'rounded-2xl',
        'bg-[var(--bg-card)]',
        'border border-[var(--border)]',
        'p-6',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon ? (
          <span className="text-[var(--accent)]">{icon}</span>
        ) : null}
        <h3 className="text-base font-semibold text-[var(--text)]">
          {title}
        </h3>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
