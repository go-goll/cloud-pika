import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** 展示图标 */
  icon?: ReactNode;
  /** 插图图片路径 */
  illustration?: string;
  /** 标题 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** 操作按钮区域 */
  action?: ReactNode;
  /** 自定义类名 */
  className?: string;
}

/** 空状态展示组件，支持插图图片和呼吸动画 */
export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center py-16',
        'text-center animate-fade-in',
        className ?? '',
      ].join(' ')}
    >
      {/* 插图图片优先于图标 */}
      {illustration ? (
        <img
          src={illustration}
          alt={title}
          className="mb-6 h-36 w-auto animate-float"
          draggable={false}
        />
      ) : icon ? (
        <div className="mb-4 text-[var(--text-secondary)] opacity-40">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-base font-semibold text-[var(--text)]">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[var(--text-secondary)]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
