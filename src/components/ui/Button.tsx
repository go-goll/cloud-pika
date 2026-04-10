import type {
  ButtonHTMLAttributes,
  PropsWithChildren,
} from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconOnly?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: [
    'bg-[var(--accent)] text-[var(--accent-text)]',
    'hover:bg-[var(--accent-hover)]',
    'active:scale-[0.97]',
    'shadow-[var(--shadow-sm)]',
    'hover:shadow-[var(--shadow-md)]',
  ].join(' '),
  secondary: [
    'border border-[var(--border)]',
    'bg-[var(--bg)]',
    'text-[var(--text)]',
    'hover:bg-[var(--bg-raised)]',
    'hover:border-[var(--text-secondary)]',
    'active:scale-[0.97]',
  ].join(' '),
  ghost: [
    'bg-transparent',
    'text-[var(--text-secondary)]',
    'hover:bg-[var(--bg-raised)]',
    'hover:text-[var(--text)]',
    'active:scale-[0.97]',
  ].join(' '),
  danger: [
    'bg-[var(--danger)] text-white',
    'hover:brightness-110',
    'active:scale-[0.97]',
    'shadow-[var(--shadow-sm)]',
  ].join(' '),
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3 text-sm gap-1.5',
  lg: 'h-10 px-5 text-sm gap-2',
};

const iconOnlySizeClasses: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const spinnerSize: Record<Size, 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/** 通用按钮组件，支持多种变体、尺寸和加载态 */
export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  iconOnly = false,
  type = 'button',
  disabled,
  ...rest
}: PropsWithChildren<ButtonProps>) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center',
        'rounded-md font-medium',
        'transition-all duration-150',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50',
        'focus-visible:ring-2',
        'focus-visible:ring-[var(--accent)]/30',
        'focus-visible:outline-none',
        variantClasses[variant],
        iconOnly
          ? iconOnlySizeClasses[size]
          : sizeClasses[size],
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Spinner size={spinnerSize[size]} />
      ) : (
        children
      )}
    </button>
  );
}
