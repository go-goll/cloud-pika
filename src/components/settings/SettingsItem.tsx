import type { PropsWithChildren } from 'react';

interface SettingsItemProps {
  label: string;
  description?: string;
}

/** 单个设置项：左侧标签+描述，右侧控制器 */
export function SettingsItem({
  label,
  description,
  children,
}: PropsWithChildren<SettingsItemProps>) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-4',
        'rounded-[calc(var(--radius)-4px)]',
        'bg-[var(--surface-high)] px-3 py-2.5',
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
