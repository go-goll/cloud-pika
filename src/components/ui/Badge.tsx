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
  default: [
    'bg-[color-mix(in_srgb,var(--primary)_18%,transparent)]',
    'text-[var(--primary)]',
  ].join(' '),
  success: [
    'bg-[color-mix(in_srgb,var(--success)_18%,transparent)]',
    'text-[var(--success)]',
  ].join(' '),
  warning: [
    'bg-[color-mix(in_srgb,#f59e0b_18%,transparent)]',
    'text-[#f59e0b]',
  ].join(' '),
  danger: [
    'bg-[color-mix(in_srgb,var(--danger)_18%,transparent)]',
    'text-[var(--danger)]',
  ].join(' '),
  muted: [
    'bg-[var(--surface-elevated)]',
    'text-[var(--text-muted)]',
  ].join(' '),
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
