import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** 展示图标 */
  icon?: ReactNode;
  /** 标题 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** 操作按钮区域 */
  action?: ReactNode;
  /** 自定义类名 */
  className?: string;
}

/** 空状态展示组件，用于列表无数据时的友好提示 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center py-16',
        'text-center',
        className ?? '',
      ].join(' ')}
    >
      {icon && (
        <div className="mb-4 text-on-surface-variant opacity-60">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-on-surface">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
