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
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text)]">
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
