import type {
  ButtonHTMLAttributes,
  PropsWithChildren,
} from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮风格 */
  variant?: Variant;
  /** 按钮尺寸 */
  size?: Size;
  /** 加载状态：显示 Spinner 并禁用交互 */
  loading?: boolean;
  /** 仅图标模式（正方形按钮） */
  iconOnly?: boolean;
}

/** 风格样式映射 */
const variantClasses: Record<Variant, string> = {
  primary: [
    'bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-soft)_100%)]',
    'text-[var(--on-primary)]',
    'shadow-[0_8px_30px_var(--primary-glow)]',
  ].join(' '),
  secondary: 'bg-[var(--surface-elevated)] text-[var(--text)]',
  ghost: [
    'bg-transparent text-[var(--text-muted)]',
    'hover:text-[var(--text)]',
  ].join(' '),
  danger: [
    'bg-[color-mix(in_srgb,var(--danger)_84%,black)]',
    'text-white',
  ].join(' '),
};

/** 尺寸样式映射 */
const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-sm',
};

/** 仅图标模式的尺寸映射（正方形） */
const iconOnlySizeClasses: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
};

/** Spinner 尺寸映射 */
const spinnerSize: Record<Size, 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

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
        'rounded-[var(--radius)] font-medium transition-all duration-200',
        'hover:brightness-110 hover:scale-[1.02]',
        'active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'disabled:hover:scale-100 disabled:hover:brightness-100',
        variantClasses[variant],
        iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
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
