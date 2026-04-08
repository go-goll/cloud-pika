import type { PropsWithChildren } from 'react';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted';

interface BadgeProps {
  /** 徽章风格变体 */
  variant?: BadgeVariant;
  /** 自定义类名 */
  className?: string;
}

/** 徽章变体样式映射 */
const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: [
    'bg-[color-mix(in_srgb,#f59e0b_18%,transparent)]',
    'text-[#f59e0b]',
  ].join(' '),
  danger: 'bg-danger/10 text-danger',
  muted: 'bg-surface-container-low text-on-surface-variant',
};

/** 徽章组件，支持多种风格变体 */
export function Badge({
  children,
  variant = 'default',
  className,
}: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
        variantClasses[variant],
        className ?? '',
      ].join(' ')}
    >
      {children}
    </span>
  );
}
