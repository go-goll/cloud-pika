import type { PropsWithChildren, ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

/** 空状态占位组件 */
export function EmptyState({
  icon,
  title,
  description,
  children,
}: PropsWithChildren<EmptyStateProps>) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon ? (
        <div className="mb-3 text-[var(--text-muted)]">{icon}</div>
      ) : null}
      <p className="text-sm font-medium text-[var(--text)]">
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {description}
        </p>
      ) : null}
      {children ? (
        <div className="mt-4">{children}</div>
      ) : null}
    </div>
  );
}
