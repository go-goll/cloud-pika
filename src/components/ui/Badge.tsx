import type { PropsWithChildren } from 'react';

type BadgeVariant =
  | 'default'
  | 'muted'
  | 'success'
  | 'danger'
  | 'warning';

interface BadgeProps {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: [
    'bg-[color-mix(in_srgb,var(--primary)_18%,transparent)]',
    'text-[var(--primary)]',
  ].join(' '),
  muted: [
    'bg-[var(--surface-elevated)]',
    'text-[var(--text-muted)]',
  ].join(' '),
  success: [
    'bg-[color-mix(in_srgb,var(--success)_18%,transparent)]',
    'text-[var(--success)]',
  ].join(' '),
  danger: [
    'bg-[color-mix(in_srgb,var(--danger)_18%,transparent)]',
    'text-[var(--danger)]',
  ].join(' '),
  warning: [
    'bg-[color-mix(in_srgb,#f59e0b_18%,transparent)]',
    'text-[#b45309] dark:text-[#fbbf24]',
  ].join(' '),
};

/** 标签组件，支持多种语义变体 */
export function Badge({
  variant = 'default',
  children,
}: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        'text-xs font-medium',
        variantClasses[variant],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
